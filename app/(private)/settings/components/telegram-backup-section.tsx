import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2Icon,
  SendIcon,
  ShieldCheckIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  MessageSquareIcon,
  SettingsIcon,
  TrashIcon,
  CalendarIcon,
  CalendarDaysIcon,
  ClockIcon,
  UploadCloudIcon,
  FileJsonIcon,
  XIcon,
  CheckCircle2Icon,
  WalletIcon,
  TagIcon,
  ReceiptIcon,
} from 'lucide-react';
import { useTelegram } from '../hooks/use-telegram';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const getInitials = (name: string | null) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function TelegramBackupSection() {
  const {
    connection,
    isLoading,
    refetchConnection,
    generateToken,
    isGeneratingToken,
    disconnect,
    isDisconnecting,
    updateConfig,
    isUpdatingConfig,
    triggerBackup,
    isBackingUp,
  } = useTelegram();

  const [openConnectDialog, setOpenConnectDialog] = React.useState(false);
  const [connectLink, setConnectLink] = React.useState('');
  const [isCheckingConnection, setIsCheckingConnection] = React.useState(false);

  // Trạng thái nhập dữ liệu khôi phục
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState(0);
  const [importStep, setImportStep] = React.useState('');
  const [importResult, setImportResult] = React.useState<{
    accounts: number;
    categories: number;
    transactions: number;
  } | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast.error('Chỉ chấp nhận file sao lưu định dạng .json');
      return;
    }
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById("import-backup-file-drag") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleImportData = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    setImportProgress(0);
    setImportStep('Đang chuẩn bị tệp tin sao lưu...');
    setImportResult(null);

    const progressInterval = setInterval(() => {
      setImportProgress((prev) => {
        let next = prev;
        if (prev < 15) {
          setImportStep('Đang giải nén và đọc file sao lưu...');
          next = prev + Math.floor(Math.random() * 3) + 2;
        } else if (prev < 45) {
          setImportStep('Đang xác thực cấu trúc và dữ liệu...');
          next = prev + Math.floor(Math.random() * 4) + 1;
        } else if (prev < 75) {
          setImportStep('Đang tiến hành khôi phục tài khoản và danh mục...');
          next = prev + Math.floor(Math.random() * 3) + 1;
        } else if (prev < 95) {
          setImportStep('Đang khôi phục lịch sử giao dịch...');
          next = prev + Math.floor(Math.random() * 2) + 1;
        }
        return Math.min(next, 95);
      });
    }, 120);

    try {
      const fileText = await selectedFile.text();
      const backupData = JSON.parse(fileText);

      if (!backupData || (!backupData.accounts && !backupData.categories && !backupData.transactions)) {
        clearInterval(progressInterval);
        toast.error("File sao lưu không đúng định dạng hoặc không có dữ liệu.");
        setIsImporting(false);
        return;
      }

      const res = await fetch("/api/telegram/backup/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backupData),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Nhập dữ liệu thất bại");
      }

      clearInterval(progressInterval);
      setImportProgress(100);
      setImportStep('Khôi phục dữ liệu hoàn tất!');
      setImportResult(result.details);
      setSelectedFile(null);

      // Tự động reload sau 5 giây để làm mới UI nếu người dùng không tự click
      setTimeout(() => {
        window.location.reload();
      }, 5000);

    } catch (err: unknown) {
      clearInterval(progressInterval);
      console.error(err);
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi nhập dữ liệu.";
      toast.error(msg);
      setIsImporting(false);
    }
  };

  const [backupProgress, setBackupProgress] = React.useState(0);
  const [showBackupDialog, setShowBackupDialog] = React.useState(false);

  // Gửi yêu cầu sao lưu thủ công kèm giả lập tiến trình
  const handleTriggerBackup = () => {
    setShowBackupDialog(true);
    setBackupProgress(0);

    const progressInterval = setInterval(() => {
      setBackupProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        const step = Math.floor(Math.random() * 4) + 2; // Tăng ngẫu nhiên từ 2-5%
        return Math.min(prev + step, 95);
      });
    }, 150);

    triggerBackup(undefined, {
      onSuccess: () => {
        clearInterval(progressInterval);
        setBackupProgress(100);
        setTimeout(() => {
          setShowBackupDialog(false);
        }, 800);
      },
      onError: () => {
        clearInterval(progressInterval);
        setShowBackupDialog(false);
      }
    });
  };

  // Xử lý mở Dialog liên kết
  const handleOpenConnect = async () => {
    try {
      const data = await generateToken();
      setConnectLink(data.link);
      setOpenConnectDialog(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Làm mới trạng thái kết nối
  const handleCheckConnection = async () => {
    setIsCheckingConnection(true);
    try {
      await refetchConnection();
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // Sinh câu mô tả động dựa trên cấu hình lịch sao lưu
  const getScheduleDescription = () => {
    const { backup_interval, backup_day, backup_hour } = connection;
    const hourStr = `${String(backup_hour).padStart(2, '0')}:00`;

    if (backup_interval === 'daily') {
      return `Hệ thống sẽ tự động gửi bản sao lưu mới nhất đến Telegram của bạn vào lúc ${hourStr} hàng ngày.`;
    }

    if (backup_interval === 'weekly') {
      const days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
      const dayStr = days[backup_day - 1] || 'Thứ Hai';
      return `Hệ thống sẽ tự động gửi bản sao lưu mới nhất đến Telegram của bạn vào lúc ${hourStr} ngày ${dayStr} hàng tuần.`;
    }

    if (backup_interval === 'monthly') {
      return `Hệ thống sẽ tự động gửi bản sao lưu mới nhất đến Telegram của bạn vào lúc ${hourStr} ngày ${backup_day} hàng tháng.`;
    }

    return '';
  };

  // Tự động đóng Dialog khi kết nối thành công
  React.useEffect(() => {
    if (connection.connected && openConnectDialog) {
      const timer = setTimeout(() => {
        setOpenConnectDialog(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [connection.connected, openConnectDialog]);

  if (isLoading) {
    return (
      <div className="flex h-60 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="h-5 w-5 animate-spin text-primary" />
        Đang tải thông tin cấu hình sao lưu...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Giới thiệu tính năng */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheckIcon className="size-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold">Sao lưu dữ liệu bảo mật</h2>
        </div>
        <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
          Xuất toàn bộ dữ liệu tài chính cá nhân của bạn (Tài khoản, Danh mục, Giao dịch) thành file định dạng JSON và gửi trực tiếp qua Telegram Bot. Dữ liệu được mã hóa truyền tải và chỉ duy nhất bạn có thể tải về từ phòng chat riêng tư của mình.
        </p>
      </section>

      {/* Trạng thái liên kết */}
      {!connection.connected ? (
        <section className="rounded-xl border border-dashed border-border bg-card p-8 text-center flex flex-col items-center justify-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-linear-to-br from-primary/80 to-primary text-primary-foreground shadow-md mb-4 animate-pulse">
            <SendIcon className="size-6 rotate-45 mr-1" />
          </div>
          <h3 className="text-base font-bold">Chưa kết nối Telegram</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6 leading-relaxed">
            Kết nối tài khoản của bạn với Telegram Bot để bắt đầu nhận các bản sao lưu dữ liệu thủ công hoặc định kỳ.
          </p>
          <Button
            type="button"
            onClick={handleOpenConnect}
            disabled={isGeneratingToken}
            className="font-semibold px-6 h-10 gap-2"
          >
            {isGeneratingToken ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="size-4 rotate-45 mr-0.5" />
            )}
            Kết nối Telegram Bot
          </Button>
        </section>
      ) : (
        <>
          {/* Đã kết nối */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/2 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {connection.telegram_avatar_path ? (
                    <div className="size-12 rounded-full overflow-hidden border-2 border-background shadow-md select-none">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/telegram/avatar?path=${encodeURIComponent(connection.telegram_avatar_path)}`}
                        alt={connection.telegram_display_name || connection.telegram_username || 'Telegram User'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="size-12 rounded-full flex items-center justify-center bg-linear-to-br from-pink-500 to-rose-500 text-white font-bold text-sm shadow-md select-none">
                      {getInitials(connection.telegram_display_name || connection.telegram_username)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-[#26A5E4] text-white border-2 border-background shadow-xs select-none">
                    <SendIcon className="size-2.5 translate-x-[-0.5px] translate-y-[0.5px]" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-foreground truncate max-w-[150px] sm:max-w-none">
                      {connection.telegram_display_name || 'Telegram User'}
                    </h3>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Đang hoạt động
                    </span>
                  </div>
                  {connection.telegram_username && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      Username:
                      <span className="font-medium text-primary">
                        @{connection.telegram_username}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckConnection}
                  disabled={isCheckingConnection}
                  className="h-9 rounded-lg gap-1 px-3 cursor-pointer"
                  title="Cập nhật trạng thái"
                >
                  <RefreshCwIcon className={cn('size-3.5', isCheckingConnection && 'animate-spin')} />
                  Làm mới
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => disconnect()}
                  disabled={isDisconnecting}
                  className="h-9 rounded-lg gap-1 px-3 cursor-pointer"
                >
                  {isDisconnecting ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <TrashIcon className="size-3.5" />
                  )}
                  Hủy liên kết
                </Button>
              </div>
            </div>
          </section>

          {/* Trigger Backup & Auto-backup Setup */}
          <div className="grid gap-6 sm:grid-cols-2 items-start">
            {/* Hộp sao lưu thủ công */}
            <section className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <MessageSquareIcon className="size-4 text-primary" />
                  Sao lưu thủ công
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Xuất dữ liệu chi tiêu và gửi trực tiếp file JSON vào tin nhắn Telegram riêng tư của bạn ngay lập tức.
                </p>
              </div>
              <div className="mt-6">
                <Button
                  type="button"
                  onClick={handleTriggerBackup}
                  disabled={isBackingUp || showBackupDialog}
                  className="w-full font-semibold h-10 gap-1.5"
                >
                  {isBackingUp ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendIcon className="size-4 rotate-45 mr-0.5" />
                  )}
                  Gửi sao lưu ngay bây giờ
                </Button>
              </div>
            </section>

            {/* Hộp cấu hình sao lưu tự động */}
            <section className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <SettingsIcon className="size-4 text-primary" />
                  Tự động sao lưu định kỳ
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed min-h-[36px]">
                  {connection.is_auto_backup ? (
                    <span className="text-primary font-medium">💾 {getScheduleDescription()}</span>
                  ) : (
                    "Bật tự động sao lưu để định kỳ nhận file backup dữ liệu qua Telegram của bạn."
                  )}
                </p>
              </div>

              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-2.5">
                  <span className="text-xs font-semibold text-foreground">Kích hoạt Auto-Backup</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={connection.is_auto_backup}
                    disabled={isUpdatingConfig}
                    onClick={() => updateConfig({ is_auto_backup: !connection.is_auto_backup })}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      connection.is_auto_backup ? 'bg-primary' : 'bg-muted-foreground/30',
                      isUpdatingConfig && 'opacity-60 pointer-events-none'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out',
                        connection.is_auto_backup ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>

                {/* Cấu hình lịch trình khi bật Auto-Backup */}
                {connection.is_auto_backup && (
                  <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Tần suất */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <CalendarDaysIcon className="size-3.5 text-primary" />
                          Tần suất
                        </label>
                        <Select
                          value={connection.backup_interval}
                          disabled={isUpdatingConfig}
                          onValueChange={(val: 'daily' | 'weekly' | 'monthly') => {
                            // Reset ngày mặc định về 1 khi đổi tần suất
                            updateConfig({ backup_interval: val, backup_day: 1 });
                          }}
                        >
                          <SelectTrigger className="w-full h-10 rounded-xl bg-background border-border text-xs font-semibold focus:ring-1 focus:ring-primary">
                            <SelectValue placeholder="Chọn tần suất" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border shadow-md">
                            <SelectItem value="daily" className="text-xs py-2 cursor-pointer">Hàng ngày</SelectItem>
                            <SelectItem value="weekly" className="text-xs py-2 cursor-pointer">Hàng tuần</SelectItem>
                            <SelectItem value="monthly" className="text-xs py-2 cursor-pointer">Hàng tháng</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Giờ */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <ClockIcon className="size-3.5 text-primary" />
                          Giờ sao lưu
                        </label>
                        <Select
                          value={String(connection.backup_hour)}
                          disabled={isUpdatingConfig}
                          onValueChange={(val) => {
                            updateConfig({ backup_hour: Number(val) });
                          }}
                        >
                          <SelectTrigger className="w-full h-10 rounded-xl bg-background border-border text-xs font-semibold focus:ring-1 focus:ring-primary">
                            <SelectValue placeholder="Chọn giờ" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border shadow-md max-h-[200px] overflow-y-auto">
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={String(i)} className="text-xs py-2 cursor-pointer">
                                {String(i).padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Chọn Ngày (Ẩn nếu tần suất là Hàng ngày) */}
                    {connection.backup_interval !== 'daily' && (
                      <div className="space-y-1.5 text-left animate-in fade-in duration-200">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <CalendarIcon className="size-3.5 text-primary" />
                          {connection.backup_interval === 'weekly' ? 'Chọn Thứ trong tuần' : 'Chọn Ngày trong tháng'}
                        </label>
                        <Select
                          value={String(connection.backup_day)}
                          disabled={isUpdatingConfig}
                          onValueChange={(val) => {
                            updateConfig({ backup_day: Number(val) });
                          }}
                        >
                          <SelectTrigger className="w-full h-10 rounded-xl bg-background border-border text-xs font-semibold focus:ring-1 focus:ring-primary">
                            <SelectValue placeholder="Chọn ngày" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border shadow-md max-h-[200px] overflow-y-auto">
                            {connection.backup_interval === 'weekly' ? (
                              <>
                                <SelectItem value="1" className="text-xs py-2 cursor-pointer">Thứ Hai</SelectItem>
                                <SelectItem value="2" className="text-xs py-2 cursor-pointer">Thứ Ba</SelectItem>
                                <SelectItem value="3" className="text-xs py-2 cursor-pointer">Thứ Tư</SelectItem>
                                <SelectItem value="4" className="text-xs py-2 cursor-pointer">Thứ Năm</SelectItem>
                                <SelectItem value="5" className="text-xs py-2 cursor-pointer">Thứ Sáu</SelectItem>
                                <SelectItem value="6" className="text-xs py-2 cursor-pointer">Thứ Bảy</SelectItem>
                                <SelectItem value="7" className="text-xs py-2 cursor-pointer">Chủ Nhật</SelectItem>
                              </>
                            ) : (
                              Array.from({ length: 31 }, (_, i) => (
                                <SelectItem key={i + 1} value={String(i + 1)} className="text-xs py-2 cursor-pointer">
                                  Ngày {i + 1}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {/* Dialog Hướng dẫn liên kết Telegram */}
      <Dialog open={openConnectDialog} onOpenChange={setOpenConnectDialog}>
        <DialogContent className="max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl overflow-hidden">
          {/* Background gradient mờ tinh tế ở góc */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3 text-left">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <SendIcon className="size-5 rotate-45 mr-0.5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Kết nối Telegram Bot
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Thực hiện 3 bước đơn giản dưới đây để liên kết tài khoản:
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Hộp các bước hướng dẫn trực quan dạng card */}
          <div className="space-y-3 my-4 text-left">
            <div className="flex items-start gap-3 p-3 rounded-xl border border-border/40 bg-muted/10 transition-all duration-300 hover:bg-muted/20">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-xs">
                1
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-foreground">Mở phòng chat với Bot</p>
                <p className="text-muted-foreground leading-relaxed">
                  Nhấn nút <span className="font-semibold text-primary">&quot;Mở Telegram Bot&quot;</span> ở dưới để di chuyển sang Telegram.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl border border-border/40 bg-muted/10 transition-all duration-300 hover:bg-muted/20">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-xs">
                2
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-foreground">Kích hoạt kết nối</p>
                <p className="text-muted-foreground leading-relaxed">
                  Khi chat mở ra, nhấn nút <span className="font-semibold text-foreground">Bắt đầu (Start)</span> để gửi mã xác thực.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl border border-border/40 bg-muted/10 transition-all duration-300 hover:bg-muted/20">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-xs">
                3
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-foreground">Hoàn thành xác thực</p>
                <p className="text-muted-foreground leading-relaxed">
                  Bot gửi tin nhắn xác nhận. Quay lại trang này, hệ thống sẽ tự động đồng bộ trạng thái.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <Button
              asChild
              className="w-full font-semibold h-11 gap-1.5"
            >
              <a href={connectLink} target="_blank" rel="noopener noreferrer">
                Mở Telegram Bot
                <ExternalLinkIcon className="size-4" />
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCheckConnection}
              disabled={isCheckingConnection}
              className="w-full text-xs border-primary/10 hover:border-primary/30 text-primary hover:bg-primary/5 h-10 rounded-xl gap-1.5 active:scale-[0.99] transition-all duration-200 cursor-pointer"
            >
              {isCheckingConnection ? (
                <Loader2Icon className="size-4 animate-spin text-primary" />
              ) : (
                <RefreshCwIcon className="size-4" />
              )}
              Tôi đã nhấn Start - Kiểm tra kết nối
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* dialog: Backup Loading Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={() => { }}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl flex flex-col items-center text-center focus:outline-none">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary shadow-xs mb-4">
            <Loader2Icon className="size-8 animate-spin" />
          </div>
          <DialogTitle className="text-base font-bold text-foreground">
            Đang tiến hành sao lưu ({backupProgress}%)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-xs">
            Hệ thống đang chuẩn bị tệp tin sao lưu bảo mật của bạn và gửi qua Telegram Bot. Quá trình này có thể mất vài giây.
          </DialogDescription>
          <div className="w-full bg-muted/40 rounded-full h-1.5 mt-6 overflow-hidden relative">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${backupProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground/80 mt-3 italic animate-pulse">
            Vui lòng không đóng trang này lúc này...
          </p>
        </DialogContent>
      </Dialog>

      {/* Khôi phục dữ liệu bằng File Drag & Drop Zone */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col relative overflow-hidden mt-2">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/2 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <UploadCloudIcon className="size-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold">Khôi phục dữ liệu từ bản sao lưu</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          Nhập tệp tin sao lưu (.json) của bạn để khôi phục cấu trúc ví, danh mục chi tiêu và lịch sử giao dịch. Các dữ liệu trùng mã định danh (ID) sẽ được ghi đè tự động.
        </p>

        {/* Drag & Drop Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative select-none",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border bg-muted/10 hover:bg-muted/20 hover:border-muted-foreground/30",
            selectedFile && "border-primary/50 bg-primary/5"
          )}
          onClick={() => {
            if (!selectedFile) {
              document.getElementById("import-backup-file-drag")?.click();
            }
          }}
        >
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
            id="import-backup-file-drag"
            disabled={isImporting}
          />

          {!selectedFile ? (
            <div className="flex flex-col items-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-background border border-border text-muted-foreground shadow-xs mb-3 transition-transform duration-300">
                <UploadCloudIcon className="size-6 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Kéo thả file sao lưu .json vào đây
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                hoặc click để chọn file từ máy tính
              </p>
              <span className="text-[10px] text-muted-foreground/60 mt-4 px-2 py-0.5 rounded-full bg-background/50 border border-border/50">
                Định dạng tệp tin: JSON
              </span>
            </div>
          ) : (
            <div className="w-full max-w-sm flex items-center justify-between p-3.5 rounded-xl border border-primary/20 bg-background/80 shadow-xs relative z-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
                  <FileJsonIcon className="size-5" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-foreground truncate max-w-[200px]">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                className="size-8 rounded-lg hover:bg-destructive/10 hover:text-destructive cursor-pointer shrink-0"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="mt-4 flex justify-end animate-in fade-in slide-in-from-top-1.5 duration-200">
            <Button
              onClick={handleImportData}
              disabled={isImporting}
              className="px-6 h-10 text-xs font-bold gap-1.5 shadow-md shadow-primary/10"
            >
              {isImporting ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  Đang xử lý khôi phục...
                </>
              ) : (
                <>
                  <RefreshCwIcon className="size-3.5 mr-0.5" />
                  Bắt đầu khôi phục dữ liệu
                </>
              )}
            </Button>
          </div>
        )}
      </section>

      {/* dialog: Import Progress & Success Dialog */}
      <Dialog open={isImporting} onOpenChange={() => { if (importResult) { setIsImporting(false); window.location.reload(); } }}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl flex flex-col items-center text-center focus:outline-none overflow-hidden">
          {/* Background gradient nhẹ ở góc */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {!importResult ? (
            // Giao diện đang tải (Import Progress)
            <>
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary shadow-xs mb-4 animate-pulse">
                <Loader2Icon className="size-8 animate-spin" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                Đang khôi phục dữ liệu ({importProgress}%)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-xs">
                {importStep}
              </DialogDescription>
              <div className="w-full bg-muted/40 rounded-full h-1.5 mt-6 overflow-hidden relative">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/80 mt-3 italic">
                Vui lòng không đóng tab trình duyệt hoặc làm mới trang...
              </p>
            </>
          ) : (
            // Giao diện thành công (Success UI)
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
              {/* Sóng nước sonar cho icon success */}
              <div className="relative flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
                <CheckCircle2Icon className="size-9 text-emerald-500 relative z-10" />
              </div>

              <DialogTitle className="text-lg font-extrabold text-foreground tracking-tight">
                Khôi phục dữ liệu thành công!
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-xs">
                Bản sao lưu đã được tích hợp hoàn tất vào Workspace của bạn.
              </DialogDescription>

              {/* Grid hiển thị số lượng chi tiết */}
              <div className="w-full grid grid-cols-3 gap-3.5 my-6">
                {/* 1. Tài khoản */}
                <div className="flex flex-col items-center p-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 hover:bg-emerald-500/8 transition-colors duration-200">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 mb-2">
                    <WalletIcon className="size-4.5" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">Tài khoản</span>
                  <span className="text-base font-extrabold text-foreground mt-0.5 animate-in fade-in slide-in-from-bottom-1 duration-300 delay-100">
                    {importResult.accounts}
                  </span>
                </div>

                {/* 2. Danh mục */}
                <div className="flex flex-col items-center p-3 rounded-2xl border border-sky-500/10 bg-sky-500/5 hover:bg-sky-500/8 transition-colors duration-200">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 mb-2">
                    <TagIcon className="size-4.5" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">Danh mục</span>
                  <span className="text-base font-extrabold text-foreground mt-0.5 animate-in fade-in slide-in-from-bottom-1 duration-300 delay-200">
                    {importResult.categories}
                  </span>
                </div>

                {/* 3. Giao dịch */}
                <div className="flex flex-col items-center p-3 rounded-2xl border border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/8 transition-colors duration-200">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 mb-2">
                    <ReceiptIcon className="size-4.5" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">Giao dịch</span>
                  <span className="text-base font-extrabold text-foreground mt-0.5 animate-in fade-in slide-in-from-bottom-1 duration-300 delay-300">
                    {importResult.transactions}
                  </span>
                </div>
              </div>

              {/* Nút bấm xác nhận & Tự động reload sau 5s */}
              <div className="w-full space-y-2">
                <Button
                  onClick={() => {
                    setIsImporting(false);
                    window.location.reload();
                  }}
                  className="w-full h-11 font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/15 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform duration-200 cursor-pointer text-xs"
                >
                  Hoàn tất & Làm mới
                </Button>
                <p className="text-[9px] text-muted-foreground/75 italic animate-pulse">
                  Hệ thống sẽ tự động làm mới trang sau vài giây...
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
