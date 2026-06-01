'use client';

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
} from 'lucide-react';
import { useTelegram } from '../hooks/use-telegram';
import { cn } from '@/lib/utils';

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
      setOpenConnectDialog(false);
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
          Xuất toàn bộ dữ liệu tài chính của bạn (Workspace, Tài khoản, Danh mục, Giao dịch) thành file định dạng JSON và gửi trực tiếp qua Telegram Bot. Dữ liệu được mã hóa truyền tải và chỉ duy nhất bạn có thể tải về từ phòng chat riêng tư của mình.
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
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-6 py-2.5 shadow-xs hover:shadow-md transition-all cursor-pointer h-10 gap-2"
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
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary shadow-xs shrink-0">
                  <SendIcon className="size-5 rotate-45 mr-0.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-foreground">Đã kết nối Telegram</h3>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Đang hoạt động
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    Tài khoản liên kết:
                    <span className="font-semibold text-primary">
                      @{connection.telegram_username || 'Telegram User'}
                    </span>
                  </p>
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
                  onClick={() => triggerBackup()}
                  disabled={isBackingUp}
                  className="w-full bg-primary font-semibold rounded-xl h-10 gap-1.5 cursor-pointer shadow-xs hover:shadow-md transition-all"
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
                          onValueChange={(val: any) => {
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
                  Nhấn nút <span className="font-semibold text-primary">"Mở Telegram Bot"</span> ở dưới để di chuyển sang Telegram.
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
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl h-11 gap-1.5 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.99] transition-all duration-200 cursor-pointer"
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
    </div>
  );
}
