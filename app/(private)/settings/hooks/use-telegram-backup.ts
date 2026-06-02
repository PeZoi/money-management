import * as React from 'react';
import { useTelegram } from './use-telegram';
import { toast } from 'sonner';

export function useTelegramBackup() {
  const telegram = useTelegram();

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

  const [backupProgress, setBackupProgress] = React.useState(0);
  const [showBackupDialog, setShowBackupDialog] = React.useState(false);

  // Drag & Drop handlers
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
        const step = Math.floor(Math.random() * 4) + 2;
        return Math.min(prev + step, 95);
      });
    }, 150);

    telegram.triggerBackup(undefined, {
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
      const data = await telegram.generateToken();
      setConnectLink(data.link);
      setOpenConnectDialog(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Làm mới trạng thái kết nối (đồng bộ avatar, họ tên, username từ Telegram)
  const handleCheckConnection = async () => {
    setIsCheckingConnection(true);
    try {
      await telegram.syncConnection();
    } catch (err) {
      console.error("[Telegram Sync Connection Error]", err);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // Sinh câu mô tả động dựa trên cấu hình lịch sao lưu
  const getScheduleDescription = () => {
    const { backup_interval, backup_day, backup_hour } = telegram.connection;
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
    if (telegram.connection.connected && openConnectDialog) {
      const timer = setTimeout(() => {
        setOpenConnectDialog(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [telegram.connection.connected, openConnectDialog]);

  return {
    ...telegram,
    openConnectDialog,
    setOpenConnectDialog,
    connectLink,
    isCheckingConnection,
    selectedFile,
    isDragging,
    isImporting,
    setIsImporting,
    importProgress,
    importStep,
    importResult,
    backupProgress,
    showBackupDialog,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
    handleRemoveFile,
    handleImportData,
    handleTriggerBackup,
    handleOpenConnect,
    handleCheckConnection,
    getScheduleDescription,
  };
}
