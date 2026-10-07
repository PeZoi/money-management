'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  SmartphoneIcon,
  KeyIcon,
  CopyIcon,
  CheckIcon,
  RefreshCwIcon,
  SparklesIcon,
  CheckCircle2Icon,
  Loader2Icon,
  LightbulbIcon,
  ExternalLinkIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import { useShortcuts } from '../hooks/use-shortcuts';
import { toast } from 'sonner';

const ICLOUD_SHORTCUT_URL = 'https://www.icloud.com/shortcuts/c5118b6da9954aa7af45adaeb159091b';

export default function IosShortcutsSection() {
  const {
    apiKey,
    hasKey,
    isKeyLoading,
    generateKey,
    isGenerating,
  } = useShortcuts();

  const [copiedKey, setCopiedKey] = React.useState(false);
  const [copiedShortcutUrl, setCopiedShortcutUrl] = React.useState(false);

  const handleCopy = (text: string, type: 'key' | 'shortcutUrl') => {
    if (!text) return;
    navigator.clipboard.writeText(text);

    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      toast.success('Đã sao chép API Key');
    } else if (type === 'shortcutUrl') {
      setCopiedShortcutUrl(true);
      setTimeout(() => setCopiedShortcutUrl(false), 2000);
      toast.success('Đã sao chép liên kết iCloud Shortcut');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header giới thiệu */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <SmartphoneIcon className="size-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold">Tự động ghi chép qua Gõ mặt lưng iPhone (Back Tap)</h2>
        </div>
        <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
          Ngay sau khi chuyển khoản thành công trên app ngân hàng (Vietcombank, MB, Techcombank, MoMo...), chỉ cần <b>gõ 2 lần vào mặt lưng iPhone</b>: máy sẽ tự quét màn hình biên lai, hiện ô nhập nhanh ghi chú và AI sẽ tự động phân tích số tiền, gắn danh mục để lưu chi tiêu tức thì!
        </p>
      </section>

      {/* 2. Cài đặt 1-chạm qua iCloud Shortcut */}
      <section className="rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-card to-background p-5 shadow-xs relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <SparklesIcon className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  Phím tắt mẫu đã cấu hình sẵn 100%
                </h3>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Cài đặt 1-chạm
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kịch bản tối ưu 6 khối tuần tự (đã loại bỏ xác nhận xóa ảnh thừa). Bạn chỉ cần cài vào máy và điền API Key.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopy(ICLOUD_SHORTCUT_URL, 'shortcutUrl')}
              className="text-xs gap-1.5 bg-background shadow-2xs"
            >
              {copiedShortcutUrl ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
              Sao chép link
            </Button>
            <Button
              asChild
              size="sm"
              className="text-xs gap-1.5 font-semibold shadow-sm"
            >
              <a
                href={ICLOUD_SHORTCUT_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLinkIcon className="size-3.5" />
                Cài đặt vào iPhone
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Khóa bí mật cá nhân (API Key) */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyIcon className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Khóa bí mật cá nhân (API Key)
            </h3>
          </div>
          {hasKey && (
            <button
              type="button"
              onClick={() => generateKey()}
              disabled={isGenerating || isKeyLoading}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCwIcon className={`size-3 ${isGenerating ? 'animate-spin' : ''}`} />
              Tạo lại mã mới
            </button>
          )}
        </div>

        {hasKey ? (
          <div className="flex items-center gap-2 max-w-xl">
            <Input
              readOnly
              value={apiKey || ''}
              type="text"
              className="font-mono text-xs bg-muted/50 font-semibold select-all"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleCopy(apiKey || '', 'key')}
              title="Sao chép API Key"
              className="shrink-0"
            >
              {copiedKey ? <CheckIcon className="size-4 text-emerald-500" /> : <CopyIcon className="size-4" />}
            </Button>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 flex items-center justify-between gap-3 max-w-xl">
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground block">Chưa kích hoạt mã kết nối</span>
              Nhấn nút để tạo mã API Key an toàn
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => generateKey()}
              disabled={isGenerating || isKeyLoading}
              className="shrink-0 text-xs gap-1.5 font-semibold"
            >
              {isGenerating ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <SparklesIcon className="size-3.5" />
              )}
              Tạo mã API Key
            </Button>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          Mã xác thực duy nhất này dùng để dán vào trường <code>x-api-key</code> trong phím tắt ở Bước 2 bên dưới.
        </p>
      </section>

      {/* 4. Hướng dẫn thiết lập 3 bước chi tiết */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontalIcon className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Hướng dẫn thiết lập 3 bước chi tiết trên iPhone
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">Thời gian hoàn thành: ~1 phút</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bước 1 */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                1
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Thêm phím tắt vào máy
              </h4>
            </div>
            <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-primary font-bold">•</span>
                <span>Bấm nút <b>&quot;Cài đặt vào iPhone&quot;</b> ở trên (hoặc mở liên kết bằng Safari trên iPhone).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-primary font-bold">•</span>
                <span>Ứng dụng Phím tắt sẽ tự động mở lên &rarr; Nhấn nút <b>&quot;Thêm phím tắt&quot; (Add Shortcut)</b> màu xanh ở dưới cùng.</span>
              </li>
            </ul>
          </div>

          {/* Bước 2 */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                2
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Dán API Key cá nhân
              </h4>
            </div>
            <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-primary font-bold">•</span>
                <span>Mở app <b>Phím tắt (Shortcuts)</b> &rarr; Tìm phím tắt vừa thêm &rarr; Chạm vào biểu tượng <b>ba chấm (...)</b> ở góc trên phím tắt để mở sửa.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-primary font-bold">•</span>
                <span>Kéo xuống tìm khối <b>Get contents of URL</b> &rarr; Ở mục <b>Headers</b>, tìm dòng có Key là <code>x-api-key</code>.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-primary font-bold">•</span>
                <span>Dán mã <b>API Key</b> của bạn (ở mục trên) vào ô giá trị &rarr; Nhấn <b>Xong (Done)</b> góc trên phải.</span>
              </li>
            </ul>
          </div>

          {/* Bước 3 */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                3
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Gán vào Gõ mặt lưng
              </h4>
            </div>
            <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span>Mở <b>Cài đặt (Settings)</b> trên iPhone &rarr; <b>Trợ năng (Accessibility)</b> &rarr; <b>Cảm ứng (Touch)</b>.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span>Cuộn xuống dưới cùng chọn <b>Chạm vào mặt sau (Back Tap)</b> &rarr; Chọn <b>Chạm hai lần (Double Tap)</b>.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span>Cuộn xuống phần danh sách <i>Phím tắt (Shortcuts)</i> &rarr; Tích chọn đúng phím tắt bạn vừa thêm!</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Hướng dẫn cách dùng thực tế */}
        <div className="p-3.5 rounded-lg border border-blue-500/20 bg-blue-500/5 text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <LightbulbIcon className="size-4 text-blue-500 shrink-0" />
            <span>Cách sử dụng thực tế (Chỉ 1 giây):</span>
          </div>
          <ol className="text-[11px] leading-relaxed list-decimal list-inside space-y-1">
            <li>Ngay sau khi chuyển khoản thành công trên app ngân hàng (màn hình hiển thị biên lai chuyển tiền).</li>
            <li>Dùng ngón tay gõ nhẹ <b>2 lần</b> vào mặt lưng iPhone.</li>
            <li>Màn hình sẽ hiển thị hộp thoại: gõ nhanh ghi chú (ví dụ: <i>&quot;tiền ăn trưa&quot;</i>, <i>&quot;cafe bạn bè&quot;</i>) rồi nhấn <b>Xong</b>.</li>
            <li>Hệ thống AI sẽ tự đọc số tiền, phân loại danh mục, lưu vào sổ thu chi và iPhone sẽ rung thông báo kết quả!</li>
          </ol>
        </div>

        <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-medium">
          <CheckCircle2Icon className="size-4 shrink-0" />
          <span>Hoàn tất! Mọi giao dịch chuyển khoản từ giờ sẽ được ghi sổ tự động chỉ với 1 thao tác gõ lưng!</span>
        </div>
      </section>
    </div>
  );
}
