import { findBankByBin, findBankById } from '@/lib/constants/banks';

export interface ParsedVietQr {
  bankBin?: string;
  bankShortName?: string;
  bankName?: string;
  bankLogo?: string;
  bankId?: string;
  accountNumber: string;
  accountName?: string | null;
  amount?: number | null;
  note?: string | null;
  rawContent: string;
}

/**
 * Hàm phân giải chuỗi TLV (Tag-Length-Value) theo chuẩn EMVCo
 */
function parseTlv(data: string): Record<string, string> {
  const result: Record<string, string> = {};
  let index = 0;

  while (index < data.length) {
    if (index + 4 > data.length) break;

    const tag = data.substring(index, index + 2);
    const lengthStr = data.substring(index + 2, index + 4);
    const length = parseInt(lengthStr, 10);

    if (isNaN(length) || length < 0 || index + 4 + length > data.length) {
      break;
    }

    const value = data.substring(index + 4, index + 4 + length);
    result[tag] = value;
    index += 4 + length;
  }

  return result;
}

/**
 * Trích xuất thông tin người nhận từ Tag 38 (Merchant Account Information)
 */
function parseMerchantAccountInfo(tag38Value: string): { bankBin?: string; accountNumber?: string } {
  try {
    const subTags = parseTlv(tag38Value);
    // Subtag 01 chứa tổ chức thanh toán (Payment Network Specific)
    const paymentNetwork = subTags['01'];
    if (paymentNetwork) {
      const nestedTags = parseTlv(paymentNetwork);
      // Nested tag 00 = BIN ngân hàng (Napas BIN)
      // Nested tag 01 = Số tài khoản thụ hưởng
      const bankBin = nestedTags['00'];
      const accountNumber = nestedTags['01'];
      return { bankBin, accountNumber };
    }
  } catch {
    // Bỏ qua lỗi parsing tag con
  }
  return {};
}

/**
 * Trích xuất nội dung chuyển tiền từ Tag 62 (Additional Data Field)
 */
function parseAdditionalData(tag62Value: string): { note?: string } {
  try {
    const subTags = parseTlv(tag62Value);
    // Subtag 08 = Purpose of Transaction / Ghi chú thanh toán
    // Subtag 01 = Bill Number
    // Subtag 05 = Reference
    const note = subTags['08'] || subTags['01'] || subTags['05'];
    return { note };
  } catch {
    return {};
  }
}

/**
 * Kiểm tra và phân tích nếu chuỗi là URL VietQR (ví dụ: img.vietqr.io/image/...)
 */
function parseVietQrUrl(urlStr: string): ParsedVietQr | null {
  try {
    const url = new URL(urlStr);
    const pathname = url.pathname;

    // Định dạng: /image/<BANK>-<ACCOUNT_NO>-<TEMPLATE>.(jpg|png)
    const match = pathname.match(/\/image\/([a-zA-Z0-9]+)-([a-zA-Z0-9]+)/i);
    if (match) {
      const bankIdentifier = match[1];
      const accountNumber = match[2];

      const bank = findBankById(bankIdentifier) || findBankByBin(bankIdentifier);
      const amountParam = url.searchParams.get('amount');
      const addInfo = url.searchParams.get('addInfo') || url.searchParams.get('note');
      const accountNameParam = url.searchParams.get('accountName');

      const amount = amountParam ? parseFloat(amountParam) : null;

      return {
        bankBin: bank?.bin,
        bankShortName: bank?.shortName || bankIdentifier.toUpperCase(),
        bankName: bank?.name,
        bankLogo: bank?.logo,
        bankId: bank?.id,
        accountNumber,
        accountName: accountNameParam && accountNameParam.trim() ? accountNameParam.trim() : null,
        amount: amount && !isNaN(amount) && amount > 0 ? amount : null,
        note: addInfo ? decodeURIComponent(addInfo) : null,
        rawContent: urlStr,
      };
    }
  } catch {
    // Không phải URL hợp lệ
  }
  return null;
}

/**
 * Phân tích mã QR thanh toán (chuẩn EMVCo / VietQR)
 */
export function parseVietQr(content: string): ParsedVietQr | null {
  if (!content || typeof content !== 'string') return null;
  const trimmed = content.trim();

  // 1. Thử phân tích dạng URL nếu bắt đầu bằng http:// hoặc https://
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const fromUrl = parseVietQrUrl(trimmed);
    if (fromUrl) return fromUrl;
  }

  // 2. Thử phân tích định dạng chuẩn EMVCo TLV
  // Chuẩn EMVCo luôn bắt đầu với Tag 00 (Payload Format Indicator: 000201)
  if (trimmed.startsWith('000201') || trimmed.includes('000201')) {
    const emvStartIndex = trimmed.indexOf('000201');
    const emvString = trimmed.substring(emvStartIndex);
    const tags = parseTlv(emvString);

    // Bắt buộc phải có Tag 38 (Merchant Account Info)
    const tag38 = tags['38'];
    if (tag38) {
      const { bankBin, accountNumber } = parseMerchantAccountInfo(tag38);
      if (accountNumber) {
        // Tìm thông tin ngân hàng qua BIN
        const bank = bankBin ? findBankByBin(bankBin) : undefined;

        // Số tiền ở Tag 54
        const tag54Amount = tags['54'];
        let amount: number | null = null;
        if (tag54Amount) {
          const parsedNum = parseFloat(tag54Amount);
          if (!isNaN(parsedNum) && parsedNum > 0) {
            amount = parsedNum;
          }
        }

        // Tên người thụ hưởng ở Tag 59 (chỉ lấy nếu có và không rỗng)
        const tag59Name = tags['59']?.trim();
        const accountName = tag59Name && tag59Name.length > 0 ? tag59Name : null;

        // Nội dung thanh toán ở Tag 62
        let note: string | null = null;
        if (tags['62']) {
          const addData = parseAdditionalData(tags['62']);
          if (addData.note) note = addData.note.trim();
        }

        return {
          bankBin: bankBin || bank?.bin,
          bankShortName: bank?.shortName || (bankBin ? `BIN ${bankBin}` : 'Ngân hàng'),
          bankName: bank?.name,
          bankLogo: bank?.logo,
          bankId: bank?.id,
          accountNumber,
          accountName,
          amount,
          note,
          rawContent: trimmed,
        };
      }
    }
  }

  return null;
}

/**
 * Tính mã kiểm tra CRC-16 CCITT (chuẩn EMVCo Tag 63)
 */
export function crc16Ccitt(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Cập nhật số tiền vào chuỗi EMVCo VietQR (nếu là QR tĩnh và người dùng nhập tiền mới)
 */
export function updateVietQrAmount(rawContent: string, amount: number): string {
  if (!rawContent || !rawContent.includes('000201') || !rawContent.includes('6304')) {
    return rawContent;
  }

  try {
    const crcIndex = rawContent.lastIndexOf('6304');
    if (crcIndex === -1) return rawContent;

    // Chuỗi trước Tag 6304
    let baseString = rawContent.substring(0, crcIndex);

    // Kiểm tra xem đã có Tag 54 chưa
    const tag54Match = baseString.match(/54(\d{2})(\d+)/);
    const amountStr = Math.round(amount).toString();
    const lenStr = amountStr.length.toString().padStart(2, '0');
    const newTag54 = `54${lenStr}${amountStr}`;

    if (tag54Match) {
      baseString = baseString.replace(/54\d{2}\d+/, newTag54);
    } else {
      const tag58Index = baseString.indexOf('5802VN');
      if (tag58Index !== -1) {
        baseString = baseString.slice(0, tag58Index) + newTag54 + baseString.slice(tag58Index);
      } else {
        baseString += newTag54;
      }
    }

    // Đổi Tag 010211 (Static) thành 010212 (Dynamic) nếu có
    baseString = baseString.replace('010211', '010212');

    // Nối 6304 và tính lại CRC chuẩn EMVCo
    const withTag63Header = baseString + '6304';
    const newCrc = crc16Ccitt(withTag63Header);

    return withTag63Header + newCrc;
  } catch {
    return rawContent;
  }
}
