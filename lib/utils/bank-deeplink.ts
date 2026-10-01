import QRCode from 'qrcode';
import { BankInfo } from '@/lib/constants/banks';

export interface PayDeeplinkOptions {
  selectedBank: BankInfo;
  beneficiaryBankBin?: string;
  beneficiaryBankShortName?: string;
  accountNumber: string;
  amount?: number | null;
  note?: string | null;
}

/**
 * Tạo URL Deeplink để mở ứng dụng ngân hàng tương ứng trên iOS
 */
export function buildBankDeeplinkUrl(options: PayDeeplinkOptions): string {
  const { selectedBank, beneficiaryBankShortName, accountNumber, amount, note } = options;

  // Đối với Vietcombank hoặc MoMo, sử dụng custom scheme trực tiếp
  if (selectedBank.id === 'vcb' || selectedBank.id === 'momo') {
    return selectedBank.scheme; // 'vcbdigibank://' hoặc 'momo://'
  }

  // Đối với các ngân hàng hỗ trợ chuẩn Napas / VietQR Deeplink
  const bankIdentifier = (beneficiaryBankShortName || selectedBank.shortName).toLowerCase().replace(/\s+/g, '');
  const params = new URLSearchParams();
  params.set('app', selectedBank.vietQrAppId || selectedBank.id);
  params.set('ba', `${accountNumber}@${bankIdentifier}`);

  if (amount && amount > 0) {
    params.set('am', String(Math.round(amount)));
  }

  if (note && note.trim()) {
    params.set('tn', note.trim());
  }

  return `https://dl.vietqr.io/pay?${params.toString()}`;
}

/**
 * Sao chép văn bản vào clipboard, tương thích cả Secure Context (HTTPS/localhost)
 * lẫn Insecure Context (HTTP qua IP mạng LAN trên mobile) và các trình duyệt di động
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined' || !text) return false;

  // 1. Thử modern API trước nếu trong secure context
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Bị lỗi permission hoặc focus, chuyển tiếp xuống execCommand fallback
    }
  }

  // 2. Fallback execCommand tương thích mọi trình duyệt và mạng LAN
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.setAttribute('readonly', '');

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Tạo ảnh QR và sao chép thẳng vào Clipboard bộ nhớ tạm (PNG Blob)
 * Tương thích cả Chromium (nhận trực tiếp Blob) lẫn Safari WebKit (nhận Promise<Blob>)
 */
export async function copyQrImageToClipboard(qrContent: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Kiểm tra hỗ trợ ClipboardItem và navigator.clipboard
  if (!navigator?.clipboard?.write || typeof ClipboardItem === 'undefined') {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, qrContent, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png');
    });

    if (!blob) return false;

    // Hỗ trợ cả 2 cơ chế:
    // - Chromium yêu cầu Blob: new ClipboardItem({ 'image/png': blob })
    // - Safari WebKit yêu cầu Promise<Blob>: new ClipboardItem({ 'image/png': Promise.resolve(blob) })
    let clipboardItem: ClipboardItem;
    try {
      clipboardItem = new ClipboardItem({
        'image/png': blob,
      });
    } catch {
      clipboardItem = new ClipboardItem({
        'image/png': Promise.resolve(blob),
      });
    }

    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (err) {
    console.warn('Không thể sao chép ảnh vào clipboard:', err);
    return false;
  }
}

/**
 * Tải ảnh QR về thư viện ảnh / thiết bị
 */
export async function downloadQrImage(qrContent: string, fileName = 'vietqr.png'): Promise<boolean> {
  try {
    const dataUrl = await QRCode.toDataURL(qrContent, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
    });

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.warn('Lỗi tải ảnh QR:', err);
    return false;
  }
}

/**
 * Kích hoạt mở ứng dụng ngân hàng trên thiết bị
 */
export function openBankApp(url: string) {
  // Trên iOS Safari / Standalone PWA, gán location.href sẽ kích hoạt chuyển hướng sang App native
  window.location.href = url;
}
