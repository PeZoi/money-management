'use client';

import * as React from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Html5Qrcode } from 'html5-qrcode';
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  CopyIcon,
  CreditCardIcon,
  Loader2Icon,
  QrCodeIcon,
  RotateCcwIcon,
  UploadIcon,
  WalletIcon,
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

  // Dữ liệu giải mã từ QR
  const [parsedData, setParsedData] = React.useState<ParsedVietQr | null>(null);

  // Form state trên màn hình preview
  const [amountStr, setAmountStr] = React.useState('');
  const [note, setNote] = React.useState('');
  const [selectedCategoryId, setSelectedCategoryId] = React.useState('');
  const [selectedAccountId, setSelectedAccountId] = React.useState('');
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

  // Derive giá trị mặc định theo chuẩn React không cần useEffect setState
  const accountId = selectedAccountId || activeAccount?.id || accounts[0]?.id || '';
  const categoryId = selectedCategoryId || expenseCategories[0]?.id || '';

  // Hàm dừng camera an toàn
  const stopCamera = React.useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch {
        // Bỏ qua lỗi dừng camera nếu component đã unmount
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
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

    // Điền trước nội dung nếu có
    if (parsed.note) {
      setNote(parsed.note);
    } else {
      setNote('');
    }

    // Chuyển sang màn hình preview
    setStep('preview');
  }, [stopCamera]);

  // Khởi động camera
  const startCamera = React.useCallback(async () => {
    const container = document.getElementById('qr-reader-container');
    if (!container) return;

    try {
      await stopCamera();
      const scanner = new Html5Qrcode('qr-reader-container');
      scannerRef.current = scanner;

      setCameraError(null);
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Bỏ qua các frame rỗng khi quét
        },
      );
      setCameraActive(true);
    } catch (err: unknown) {
      console.warn('Camera start error:', err);
      setCameraError(
        'Không thể truy cập camera. Vui lòng cấp quyền trong Cài đặt Safari hoặc tải ảnh QR từ máy.',
      );
      setCameraActive(false);
    }
  }, [stopCamera, handleScanSuccess]);

  // Effect kích hoạt camera khi ở bước scanning
  React.useEffect(() => {
    if (!open || step !== 'scanning') return;

    const timer = setTimeout(() => {
      void startCamera();
    }, 250);

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

  // Xử lý quét từ file ảnh tải lên
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await stopCamera();
      const html5QrCode = new Html5Qrcode('qr-reader-container');
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

      // 1. Sao chép vào bộ nhớ tạm NGAY LẬP TỨC để đảm bảo user gesture trên iOS Safari không bị hết hạn
      if (isMoMo) {
        // Tự động sao chép ảnh QR vào clipboard để sang MoMo người dùng có thể Dán ảnh trực tiếp
        await copyQrImageToClipboard(updatedQrContent);
        await copyToClipboard(parsedData.accountNumber);
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
        note: note.trim() || parsedData.note || 'Thanh toán QR',
        created_at: new Date().toISOString(),
      });

      // 3. Hiển thị thông báo hướng dẫn
      if (isMoMo) {
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

                {/* Thông báo lỗi nếu không mở được camera */}
                {cameraError && (
                  <div className="absolute inset-0 bg-background/95 p-6 flex flex-col items-center justify-center text-center gap-3">
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
              {/* Thẻ người thụ hưởng (Beneficiary Card) */}
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
                      onClick={() => {
                        void copyToClipboard(parsedData.accountNumber);
                        toast.success('Đã sao chép số tài khoản');
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

              {/* Ô nhập số tiền */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Số tiền thanh toán</Label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={amountStr}
                    onChange={(e) => setAmountStr(formatAmountInput(e.target.value))}
                    placeholder="0"
                    className="h-12 text-xl font-bold tracking-tight pr-12 rounded-2xl bg-muted/30 focus:bg-background"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    ₫
                  </span>
                </div>
              </div>

              {/* Hàng thông tin cố định: Loại giao dịch & Ngày */}
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

              {/* Chọn danh mục chi tiêu */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Danh mục chi tiêu</Label>
                <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 border rounded-2xl bg-muted/10">
                  {expenseCategories.map((c) => {
                    const isSelected = c.id === categoryId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(c.id)}
                        className={cn(
                          'flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all',
                          isSelected
                            ? 'bg-primary/10 border border-primary/30 text-primary font-semibold shadow-2xs'
                            : 'hover:bg-muted/60 text-muted-foreground',
                        )}
                      >
                        <div className="size-7 flex items-center justify-center mb-1">
                          <IconPreview name={c.icon} className="size-4" />
                        </div>
                        <span className="text-[10px] leading-tight line-clamp-1 truncate w-full">
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chọn tài khoản nguồn (Ví trong app) */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tài khoản nguồn (Ví trừ tiền)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {accounts.map((acc) => {
                    const isSelected = acc.id === accountId;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setSelectedAccountId(acc.id)}
                        className={cn(
                          'flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all',
                          isSelected
                            ? 'border-primary/40 bg-primary/5 text-foreground ring-1 ring-primary/20'
                            : 'border-border/60 hover:bg-muted/40 text-muted-foreground',
                        )}
                      >
                        <div className="size-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <WalletIcon className="size-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">{acc.name}</p>
                        </div>
                        {isSelected && <CheckIcon className="size-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ghi chú */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Ghi chú giao dịch</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Ăn trưa, Cà phê..."
                  className="h-10 rounded-xl bg-muted/30 text-sm"
                />
              </div>

              {/* Chọn app ngân hàng để thanh toán */}
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

              {/* DUY NHẤT 1 NÚT BẤM: "Thanh toán" */}
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
