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
 * Sao chép số tài khoản vào clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback nếu clipboard API bị hạn chế quyền
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Tạo ảnh QR và sao chép thẳng vào Clipboard bộ nhớ tạm (PNG Blob)
 * Dành cho MoMo hoặc các app hỗ trợ dán ảnh QR từ clipboard
 */
export async function copyQrImageToClipboard(qrContent: string): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;

    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, qrContent, {
      width: 480,
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

    // Trên iOS Safari / WebKit, ClipboardItem yêu cầu Promise resolving to Blob
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      const clipboardItem = new ClipboardItem({
        'image/png': Promise.resolve(blob),
      });
      await navigator.clipboard.write([clipboardItem]);
      return true;
    }
  } catch (err) {
    console.warn('Không thể sao chép ảnh vào clipboard:', err);
  }
  return false;
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
