'use client';

import * as React from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  AlertCircleIcon,
  CalendarIcon,
  ChevronsUpDown,
  ChevronRightIcon,
  CopyIcon,
  CreditCardIcon,
  Loader2Icon,
  QrCodeIcon,
  RotateCcwIcon,
  UploadIcon,
  WalletIcon,
  ZapIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { BankSelectorModal } from '@/components/bank-selector-modal';
import IconPreview from '@/components/icons/icon-preview';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { useTransactionMutation } from '@/hooks/use-transactions';
import {
  findBankById,
  POPULAR_BANKS,
  type BankInfo,
} from '@/lib/constants/banks';
import {
  buildBankDeeplinkUrl,
  copyQrImageToClipboard,
  copyToClipboard,
  openBankApp,
} from '@/lib/utils/bank-deeplink';
import { cn } from '@/lib/utils';
import { formatVnd } from '@/app/(private)/transactions/transaction-ui';
import { formatAmountInput, parseAmount } from '@/lib/validations/transaction-schema';
import { parseVietQr, updateVietQrAmount, type ParsedVietQr } from '@/lib/utils/vietqr-parser';

interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function QrScannerDialog({
  open,
  onOpenChange,
  onSuccess,
}: QrScannerDialogProps) {
  const { categories } = useCategories();
  const { accounts, activeAccount } = useAccounts();
  const { isSubmitting, createTransaction } = useTransactionMutation();

  // Mode: scanning (quét camera/upload) hoặc preview (xem lại & xác nhận)
  const [step, setStep] = React.useState<'scanning' | 'preview'>('scanning');
  const [cameraActive, setCameraActive] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Tính năng Zoom & Đèn Flash (như Zalo / Camera iOS)
  const [zoomSupported, setZoomSupported] = React.useState(false);
  const [zoomLevel, setZoomLevel] = React.useState(1);
  const [torchSupported, setTorchSupported] = React.useState(false);
  const [torchOn, setTorchOn] = React.useState(false);

  // Dữ liệu giải mã từ QR
  const [parsedData, setParsedData] = React.useState<ParsedVietQr | null>(null);

  // Form state trên màn hình preview
  const [amountStr, setAmountStr] = React.useState('');
  const [note, setNote] = React.useState('');
  const [selectedCategoryId, setSelectedCategoryId] = React.useState('');
  const [selectedAccountId, setSelectedAccountId] = React.useState('');
  const [accountPopoverOpen, setAccountPopoverOpen] = React.useState(false);

  const [selectedBank, setSelectedBank] = React.useState<BankInfo>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('preferred_pay_bank') : null;
      if (saved) {
        const found = findBankById(saved);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return POPULAR_BANKS[0]; // Mặc định Vietcombank
  });
  const [bankModalOpen, setBankModalOpen] = React.useState(false);

  // Danh mục chi tiêu
  const expenseCategories = React.useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories],
  );

  const accountId = selectedAccountId || activeAccount?.id || accounts[0]?.id || '';
  const categoryId = selectedCategoryId || expenseCategories[0]?.id || '';
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const numAmount = React.useMemo(() => parseAmount(amountStr) || 0, [amountStr]);

  // Helper lấy class CSS danh mục đồng bộ với form tạo giao dịch
  const getCategoryClasses = (isSelected: boolean) => {
    if (!isSelected) {
      return {
        button: 'border-border bg-card hover:bg-muted/50 text-muted-foreground',
        iconSpan: 'border-border bg-muted/40 text-muted-foreground group-hover:bg-muted',
      };
    }
    return {
      button: 'border-rose-500 bg-rose-500/5 text-rose-600 dark:text-rose-400 shadow-sm ring-1 ring-rose-500/20',
      iconSpan: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    };
  };

  // Hàm dừng camera an toàn
  const stopCamera = React.useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // Bỏ qua lỗi dừng camera nếu component đã unmount
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
    setZoomLevel(1);
  }, []);

  // Xử lý khi quét mã thành công
  const handleScanSuccess = React.useCallback((decodedText: string) => {
    void stopCamera();
    const parsed = parseVietQr(decodedText);
    if (!parsed) {
      toast.error('Không tìm thấy thông tin chuyển khoản VietQR hợp lệ trong mã này.');
      return;
    }

    setParsedData(parsed);

    // Điền trước số tiền nếu QR động đã có
    if (parsed.amount && parsed.amount > 0) {
      setAmountStr(formatAmountInput(String(parsed.amount)));
    } else {
      setAmountStr('');
    }

    // Ghi chú giao dịch luôn để trống theo yêu cầu người dùng
    setNote('');

    // Chuyển sang màn hình preview
    setStep('preview');
  }, [stopCamera]);

  // Khởi động camera - tối ưu Full HD 1080p, chỉ quét QR, 12 fps chống nghẽn CPU
  const startCamera = React.useCallback(async () => {
    const container = document.getElementById('qr-reader-container');
    if (!container) return;

    try {
      await stopCamera();
      setZoomSupported(false);
      setZoomLevel(1);
      setTorchSupported(false);
      setTorchOn(false);

      // 1. Chỉ định DUY NHẤT format QR_CODE để loại bỏ hơn 10 thuật toán decode thừa, giải phóng CPU
      const scanner = new Html5Qrcode('qr-reader-container', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
        verbose: false,
      });
      scannerRef.current = scanner;

      setCameraError(null);

      // 2. Yêu cầu camera Full HD (1080p) + Lấy nét liên tục:
      // Giúp mã QR ở khoảng cách xa (50cm - 1m) vẫn giữ nguyên độ nét từng pixel,
      // không bị mờ nhạt như độ phân giải mặc định 640x480 và không bắt buộc người dùng phải dí sát camera vào QR
      const cameraConstraints: MediaTrackConstraints = {
        facingMode: { ideal: 'environment' },
        width: { min: 1024, ideal: 1920, max: 1920 },
        height: { min: 720, ideal: 1080, max: 1080 },
        advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
      };

      await scanner.start(
        cameraConstraints,
        {
          fps: 12, // Tần số vàng 12 fps: tránh nghẽn CPU trên iOS WebKit, không bị delay hàng đợi frame
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const min = Math.min(viewfinderWidth, viewfinderHeight);
            const edge = Math.floor(min * 0.82);
            return {
              width: edge,
              height: edge,
            };
          },
          aspectRatio: 1.0,
          disableFlip: true, // Tiết kiệm xử lý lật gương không cần thiết cho camera sau
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Bỏ qua các frame rỗng khi quét
        },
      );

      // 3. Kiểm tra tính năng Zoom & Đèn Flash sau khi camera đã sẵn sàng
      try {
        const caps = scanner.getRunningTrackCameraCapabilities();
        const zoomFeature = caps.zoomFeature();
        if (zoomFeature?.isSupported()) {
          setZoomSupported(true);
        }
        const torchFeature = caps.torchFeature();
        if (torchFeature?.isSupported()) {
          setTorchSupported(true);
        }
      } catch {
        // Trình duyệt không hỗ trợ các tính năng nâng cao này
      }

      setCameraActive(true);
    } catch (err: unknown) {
      console.warn('Camera start error:', err);
      // Fallback nếu camera Full HD bị thiết bị cũ từ chối: thử lại với facingMode cơ bản
      try {
        const fallbackScanner = new Html5Qrcode('qr-reader-container', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = fallbackScanner;
        await fallbackScanner.start(
          { facingMode: 'environment' },
          {
            fps: 12,
            qrbox: 250,
            aspectRatio: 1.0,
            disableFlip: true,
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {},
        );
        setCameraActive(true);
      } catch {
        setCameraError(
          'Không thể truy cập camera. Vui lòng cấp quyền trong Cài đặt Safari hoặc tải ảnh QR từ máy.',
        );
        setCameraActive(false);
      }
    }
  }, [stopCamera, handleScanSuccess]);

  // Điều khiển Zoom 1x / 2x
  const handleToggleZoom = async () => {
    if (!scannerRef.current) return;
    try {
      const caps = scannerRef.current.getRunningTrackCameraCapabilities();
      const zoom = caps.zoomFeature();
      if (zoom?.isSupported()) {
        const nextZoom = zoomLevel === 1 ? Math.min(2, zoom.max()) : 1;
        await zoom.apply(nextZoom);
        setZoomLevel(nextZoom);
      }
    } catch {
      // ignore
    }
  };

  // Điều khiển Bật/Tắt Đèn pin (Torch)
  const handleToggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const caps = scannerRef.current.getRunningTrackCameraCapabilities();
      const torch = caps.torchFeature();
      if (torch?.isSupported()) {
        const nextTorch = !torchOn;
        await torch.apply(nextTorch);
        setTorchOn(nextTorch);
      }
    } catch {
      // ignore
    }
  };

  // Effect kích hoạt camera khi ở bước scanning
  React.useEffect(() => {
    if (!open || step !== 'scanning') return;

    const timer = setTimeout(() => {
      void startCamera();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          void scannerRef.current.stop().catch(() => {});
        }
        try {
          scannerRef.current.clear();
        } catch {
          // ignore
        }
        scannerRef.current = null;
      }
    };
  }, [open, step, startCamera]);

  // Xử lý quét từ file ảnh tải lên - tối ưu với QR_CODE duy nhất
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await stopCamera();
      const html5QrCode = new Html5Qrcode('qr-reader-container', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
        verbose: false,
      });
      const decodedText = await html5QrCode.scanFile(file, true);
      try {
        html5QrCode.clear();
      } catch {
        // ignore
      }
      handleScanSuccess(decodedText);
    } catch {
      toast.error('Không nhận diện được mã QR trong ảnh này. Vui lòng thử lại với ảnh rõ hơn.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Xử lý nút bấm duy nhất: "Thanh toán"
  const handlePay = async () => {
    if (!parsedData) return;

    const numAmount = parseAmount(amountStr);
    if (!numAmount || numAmount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ lớn hơn 0');
      return;
    }

    if (!accountId) {
      toast.error('Vui lòng chọn tài khoản nguồn trong app');
      return;
    }

    try {
      const isMoMo = selectedBank.id === 'momo';
      const updatedQrContent = updateVietQrAmount(parsedData.rawContent, numAmount);

      // 1. Xử lý sao chép vào bộ nhớ tạm
      let isImageCopied = false;
      if (isMoMo) {
        // Tự động sao chép ảnh QR vào clipboard để sang MoMo dán trực tiếp
        isImageCopied = await copyQrImageToClipboard(updatedQrContent);
        if (!isImageCopied) {
          // Trình duyệt không hỗ trợ copy ảnh vào clipboard (ví dụ chạy qua HTTP mạng LAN), tự động sao chép số tài khoản
          await copyToClipboard(parsedData.accountNumber);
        }
      } else {
        // Sao chép số tài khoản thụ hưởng vào clipboard
        await copyToClipboard(parsedData.accountNumber);
      }

      // 2. Tạo giao dịch vào Database hệ thống
      await createTransaction({
        amount: numAmount,
        type: 'expense',
        category_id: categoryId || null,
        account_id: accountId,
        note: note.trim() || 'Thanh toán QR',
        created_at: new Date().toISOString(),
      });

      // 3. Hiển thị thông báo hướng dẫn
      if (isMoMo) {
        if (isImageCopied) {
          toast.success(
            `Đã sao chép ảnh QR & lưu giao dịch. Đang mở ${selectedBank.shortName}...`,
            { duration: 4000 },
          );
        } else {
          toast.success(
            `Đã lưu giao dịch và copy STK (${parsedData.accountNumber}). Đang mở ${selectedBank.shortName}...`,
            { duration: 4000 },
          );
        }
      } else {
        toast.success(
          `Đã lưu giao dịch và copy STK (${parsedData.accountNumber}). Đang mở ${selectedBank.shortName}...`,
          { duration: 4000 },
        );
      }

      // 4. Kích hoạt mở ứng dụng ngân hàng qua Deeplink
      const deeplinkUrl = buildBankDeeplinkUrl({
        selectedBank,
        beneficiaryBankBin: parsedData.bankBin,
        beneficiaryBankShortName: parsedData.bankShortName,
        accountNumber: parsedData.accountNumber,
        amount: numAmount,
        note: note.trim(),
      });

      openBankApp(deeplinkUrl);

      // 5. Đóng modal và gọi callback success
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi khi lưu giao dịch';
      toast.error(message);
    }
  };

  const handleOpenDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      void stopCamera();
    } else {
      setStep('scanning');
      setParsedData(null);
      setCameraError(null);
      setAmountStr('');
      setNote('');
      setSelectedAccountId('');
      setSelectedCategoryId('');
    }
    onOpenChange(nextOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenDialogChange}>
        <DialogContent className="max-w-md p-0 overflow-hidden sm:rounded-3xl max-h-[92vh] flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <QrCodeIcon className="size-5 text-primary" />
              {step === 'scanning' ? 'Quét QR thanh toán' : 'Xem lại giao dịch'}
            </DialogTitle>
            {step === 'preview' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setStep('scanning');
                }}
              >
                <RotateCcwIcon className="mr-1 size-3.5" />
                Quét lại
              </Button>
            )}
          </DialogHeader>

          {/* ================= STEP 1: SCANNING ================= */}
          {step === 'scanning' && (
            <div className="flex-1 flex flex-col p-4 space-y-4">
              {/* Vùng camera view finder */}
              <div className="relative aspect-square w-full max-w-[320px] mx-auto overflow-hidden rounded-2xl bg-black flex items-center justify-center border-2 border-border shadow-inner">
                <div
                  id="qr-reader-container"
                  className="w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full"
                />

                {/* Laser scan animation & Frame góc */}
                {cameraActive && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                    <div className="relative w-full h-full border-2 border-dashed border-primary/50 rounded-xl overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse shadow-[0_0_12px_rgba(var(--primary),0.8)]" />
                    </div>
                  </div>
                )}

                {/* Nút điều khiển Zoom và Flash (nếu camera hỗ trợ) - trải nghiệm như Zalo/Camera iOS */}
                {cameraActive && (zoomSupported || torchSupported) && (
                  <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2.5 z-10 pointer-events-auto">
                    {zoomSupported && (
                      <button
                        type="button"
                        onClick={handleToggleZoom}
                        className="h-8 px-3 rounded-full bg-black/65 backdrop-blur-md text-white text-xs font-bold border border-white/25 hover:bg-black/85 transition-all shadow-md active:scale-95"
                      >
                        {zoomLevel === 1 ? '1x' : `${zoomLevel.toFixed(1)}x`}
                      </button>
                    )}
                    {torchSupported && (
                      <button
                        type="button"
                        onClick={handleToggleTorch}
                        className={cn(
                          'size-8 flex items-center justify-center rounded-full backdrop-blur-md text-white border transition-all shadow-md active:scale-95',
                          torchOn
                            ? 'bg-amber-500/85 border-amber-400 text-amber-100'
                            : 'bg-black/65 border-white/25 hover:bg-black/85',
                        )}
                        title={torchOn ? 'Tắt đèn pin' : 'Bật đèn pin'}
                      >
                        <ZapIcon className={cn('size-3.5', torchOn && 'fill-amber-300 text-amber-300')} />
                      </button>
                    )}
                  </div>
                )}

                {/* Thông báo lỗi nếu không mở được camera */}
                {cameraError && (
                  <div className="absolute inset-0 bg-background/95 p-6 flex flex-col items-center justify-center text-center gap-3 z-20">
                    <AlertCircleIcon className="size-10 text-destructive" />
                    <p className="text-xs text-muted-foreground">{cameraError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void startCamera()}
                      className="mt-1 rounded-xl"
                    >
                      Thử lại
                    </Button>
                  </div>
                )}
              </div>

              {/* Nút upload ảnh từ thư viện */}
              <div className="flex flex-col items-center gap-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-11 rounded-2xl font-medium flex items-center justify-center gap-2 bg-muted/80 hover:bg-muted"
                >
                  <UploadIcon className="size-4" />
                  Chọn ảnh từ Thư viện
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  Hỗ trợ quét ảnh chụp màn hình chuyển khoản hoặc ảnh mã QR
                </p>
              </div>
            </div>
          )}

          {/* ================= STEP 2: PREVIEW ================= */}
          {step === 'preview' && parsedData && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 1. Thẻ người thụ hưởng (Beneficiary Card) */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-10 rounded-xl bg-white border p-1 flex items-center justify-center shrink-0 shadow-xs">
                      {parsedData.bankLogo ? (
                        <Image
                          src={parsedData.bankLogo}
                          alt={parsedData.bankShortName || 'Bank'}
                          width={32}
                          height={32}
                          className="size-8 object-contain"
                          unoptimized
                        />
                      ) : (
                        <CreditCardIcon className="size-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {parsedData.bankShortName}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {parsedData.bankName || 'Ngân hàng thụ hưởng'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-primary/10">
                  <span className="text-xs text-muted-foreground font-medium">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5 font-mono font-semibold text-sm text-foreground">
                    <span>{parsedData.accountNumber}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await copyToClipboard(parsedData.accountNumber);
                        if (ok) {
                          toast.success('Đã sao chép số tài khoản');
                        } else {
                          toast.error('Không thể sao chép số tài khoản. Vui lòng thử lại.');
                        }
                      }}
                      className="p-1 hover:bg-primary/10 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                      title="Sao chép STK"
                    >
                      <CopyIcon className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* TÊN CHỦ TÀI KHOẢN: Chỉ hiển thị nếu QR có tên, ngược lại ẩn hoàn toàn */}
                {parsedData.accountName && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-primary/10">
                    <span className="text-muted-foreground font-medium">Chủ tài khoản:</span>
                    <span className="font-semibold text-foreground uppercase tracking-wide">
                      {parsedData.accountName}
                    </span>
                  </div>
                )}
              </div>

              {/* 2. GHI CHÚ GIAO DỊCH (Đưa lên đầu trước số tiền, mặc định rỗng) */}
              <div className="grid gap-2">
                <Label htmlFor="tx-qr-note">Ghi chú giao dịch</Label>
                <Input
                  id="tx-qr-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập tên hoặc ghi chú giao dịch..."
                  className="h-11 rounded-xl bg-card border-border text-sm"
                />
              </div>

              {/* 3. SỐ TIỀN THANH TOÁN */}
              <div className="grid gap-2">
                <Label htmlFor="tx-qr-amount">Số tiền thanh toán</Label>
                <div className="relative">
                  <Input
                    id="tx-qr-amount"
                    type="text"
                    inputMode="numeric"
                    value={amountStr}
                    onChange={(e) => setAmountStr(formatAmountInput(e.target.value))}
                    placeholder="0"
                    className="h-12 text-xl font-bold tracking-tight pr-12 rounded-2xl bg-card border-border focus:bg-background"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    ₫
                  </span>
                </div>
              </div>

              {/* 4. Hàng thông tin cố định: Loại giao dịch & Ngày */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border p-2.5 bg-muted/20">
                  <span className="text-[11px] text-muted-foreground block">Loại giao dịch</span>
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                    <span className="size-1.5 rounded-full bg-rose-500 inline-block" />
                    Chi tiêu
                  </span>
                </div>
                <div className="rounded-xl border p-2.5 bg-muted/20">
                  <span className="text-[11px] text-muted-foreground block">Thời gian</span>
                  <span className="text-xs font-medium text-foreground flex items-center gap-1 mt-0.5">
                    <CalendarIcon className="size-3 text-muted-foreground" />
                    {format(new Date(), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              </div>

              {/* 5. DANH MỤC CHI TIÊU (Style đồng bộ 100% với form tạo giao dịch) */}
              <div className="grid gap-2">
                <Label>Danh mục</Label>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 max-h-[220px] overflow-y-auto pr-1">
                  {expenseCategories.map((c) => {
                    const isSelected = c.id === categoryId;
                    const classes = getCategoryClasses(isSelected);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(c.id)}
                        className={cn(
                          'group flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-2.5 aspect-square text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          classes.button,
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
                            classes.iconSpan,
                          )}
                        >
                          <IconPreview name={c.icon} className="size-4.5" />
                        </span>
                        <span className="text-[11px] font-semibold truncate max-w-full">
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. TÀI KHOẢN NGUỒN (Style đồng bộ 100% với AccountSelector trong form tạo giao dịch) */}
              <div className="grid gap-2">
                <Label htmlFor="tx-qr-account">Tài khoản nguồn</Label>
                <Popover open={accountPopoverOpen} onOpenChange={setAccountPopoverOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      id="tx-qr-account"
                      variant="outline"
                      className={cn(
                        'h-11 justify-between text-left font-normal rounded-xl border-border bg-card hover:bg-muted/50',
                        !accountId && 'text-muted-foreground',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <WalletIcon className="size-4 text-muted-foreground" />
                        {selectedAccount ? (
                          <span className="font-medium text-foreground">
                            {selectedAccount.icon} {selectedAccount.name}
                          </span>
                        ) : (
                          <span>Chọn tài khoản nguồn</span>
                        )}
                      </div>
                      <ChevronsUpDown className="size-4 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
                    <div className="max-h-[200px] overflow-y-auto space-y-1">
                      {accounts.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-2 text-center">
                          Không có tài khoản nào.
                        </p>
                      ) : (
                        accounts.map((acc) => {
                          const isSelected = accountId === acc.id;
                          return (
                            <button
                              key={acc.id}
                              type="button"
                              onClick={() => {
                                setSelectedAccountId(acc.id);
                                setAccountPopoverOpen(false);
                              }}
                              className={cn(
                                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted text-left',
                                isSelected && 'bg-primary/5 text-primary font-medium',
                              )}
                            >
                              <span className="text-base select-none">{acc.icon}</span>
                              <span className="flex-1 truncate">{acc.name}</span>
                              {/* Badge ưu tiên: Mặc định > Ngoài hệ thống */}
                              {acc.id === activeAccount?.id ? (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium shrink-0">
                                  Mặc định
                                </span>
                              ) : acc.is_system === false ? (
                                <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                                  Ngoài hệ thống
                                </span>
                              ) : null}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedAccount && (
                  <p className="mt-0.5 text-xs text-muted-foreground/80 flex items-center gap-1">
                    <span>Số dư:</span>
                    <span className="font-semibold text-foreground">{formatVnd(selectedAccount.balance)}</span>
                    {numAmount > 0 && (
                      <>
                        <span className="text-muted-foreground/50">→</span>
                        <span>Dự kiến:</span>
                        <span
                          className={cn(
                            'font-semibold',
                            Number(selectedAccount.balance) - numAmount >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400',
                          )}
                        >
                          {formatVnd(Number(selectedAccount.balance) - numAmount)}
                        </span>
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* 7. CHỌN ỨNG DỤNG THANH TOÁN (MoMo, Vietcombank, MB...) */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs text-muted-foreground">Ứng dụng thanh toán</Label>
                <button
                  type="button"
                  onClick={() => setBankModalOpen(true)}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl border bg-muted/30 hover:bg-muted/60 transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-lg bg-white border p-1 flex items-center justify-center shrink-0 shadow-2xs">
                      <Image
                        src={selectedBank.logo}
                        alt={selectedBank.shortName}
                        width={28}
                        height={28}
                        className="size-6 object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate block">
                        {selectedBank.shortName}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate block">
                        Chạm để đổi app thanh toán khác
                      </span>
                    </div>
                  </div>
                  <ChevronRightIcon className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* 8. DUY NHẤT 1 NÚT BẤM: "Thanh toán" */}
              <div className="pt-2 pb-1">
                <Button
                  type="button"
                  onClick={handlePay}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-2xl font-bold text-sm shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="size-4" />
                      Thanh toán
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal chọn ngân hàng */}
      <BankSelectorModal
        open={bankModalOpen}
        onOpenChange={setBankModalOpen}
        selectedBankId={selectedBank.id}
        onSelectBank={(bank) => setSelectedBank(bank)}
      />
    </>
  );
}
