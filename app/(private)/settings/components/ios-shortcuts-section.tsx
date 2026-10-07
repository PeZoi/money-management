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
  LayersIcon,
  MailIcon,
  CheckCircle2Icon,
  InfoIcon,
  Loader2Icon,
} from 'lucide-react';
import { useShortcuts } from '../hooks/use-shortcuts';
import { toast } from 'sonner';

const PRODUCTION_URL = 'https://money-dph.vercel.app/api/shortcuts/sync';

export default function IosShortcutsSection() {
  const {
    apiKey,
    hasKey,
    isKeyLoading,
    generateKey,
    isGenerating,
  } = useShortcuts();

  const [copiedKey, setCopiedKey] = React.useState(false);
  const [copiedUrl, setCopiedUrl] = React.useState(false);
  const [copiedHeader, setCopiedHeader] = React.useState(false);
  const [copiedJson, setCopiedJson] = React.useState(false);
  const [copiedAll, setCopiedAll] = React.useState(false);

  const endpointUrl = PRODUCTION_URL;

  const handleCopy = (text: string, type: 'key' | 'url' | 'header' | 'json' | 'all') => {
    if (!text) return;
    navigator.clipboard.writeText(text);

    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      toast.success('Đã sao chép API Key');
    } else if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      toast.success('Đã sao chép URL Endpoint');
    } else if (type === 'header') {
      setCopiedHeader(true);
      setTimeout(() => setCopiedHeader(false), 2000);
      toast.success('Đã sao chép giá trị Header x-api-key');
    } else if (type === 'json') {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
      toast.success('Đã sao chép cấu trúc JSON mẫu');
    } else if (type === 'all') {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
      toast.success('Đã sao chép toàn bộ thông số cấu hình!');
    }
  };

  const fullConfigText = `[CẤU HÌNH LẤY NỘI DUNG TỪ URL TRÊN IPHONE]
• URL: ${endpointUrl}
• Method (Phương thức): POST
• Headers (Tiêu đề):
  - Khóa: x-api-key
  - Giá trị: ${apiKey || 'CHƯA_TẠO_KEY'}
• Request Body (JSON):
  - sms: (Biến Shortcut Input -> chọn thuộc tính Content)
  - note: (Biến Provided Input từ bước hỏi ghi chú)`;

  return (
    <div className="space-y-6">
      {/* 1. Header giới thiệu */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <SmartphoneIcon className="size-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold">Tự động hoá ghi chép qua Email Vietcombank</h2>
        </div>
        <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
          Mỗi khi bạn chuyển tiền xong trên Vietcombank và nhận email biên lai, iPhone sẽ tự động kích hoạt phím tắt hiển thị form ghi chú nhanh và AI tự động phân tích số tiền, danh mục, trừ vào tài khoản đang kích hoạt.
        </p>
      </section>

      {/* 2. Cấu hình Khóa & Endpoint API */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <KeyIcon className="size-4 text-primary" />
          Thông tin xác thực &amp; Endpoint kết nối
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Khóa bí mật cá nhân (API Key)
              </label>
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
              <div className="flex items-center gap-2">
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
                >
                  {copiedKey ? <CheckIcon className="size-4 text-emerald-500" /> : <CopyIcon className="size-4" />}
                </Button>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 flex items-center justify-between gap-3">
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
              Mã xác thực độc nhất giúp iPhone đồng bộ dữ liệu an toàn mà không cần đăng nhập.
            </p>
          </div>

          {/* Webhook Endpoint */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              URL Endpoint tiếp nhận dữ liệu (POST)
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={endpointUrl}
                className="font-mono text-xs bg-muted/50 font-semibold text-primary select-all"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleCopy(endpointUrl, 'url')}
                title="Sao chép Endpoint URL"
              >
                {copiedUrl ? <CheckIcon className="size-4 text-emerald-500" /> : <CopyIcon className="size-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Điền link này vào ô <b>URL</b> của tác vụ <i>Get Contents of URL</i> trên iPhone.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Bảng cấu hình hoàn chỉnh để điền vào Phím tắt (Copy nhanh) */}
      <section className="rounded-xl border border-primary/25 bg-primary/5 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayersIcon className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Thông số cài đặt tác vụ &quot;Get Contents of URL&quot; (Copy nhanh)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Mở tác vụ <b>Get Contents of URL (Lấy nội dung từ URL)</b> và điền theo thông số dưới:
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleCopy(fullConfigText, 'all')}
            className="text-xs gap-1.5 bg-background shrink-0"
          >
            {copiedAll ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
            Sao chép toàn bộ thông số
          </Button>
        </div>

        <div className="space-y-3">
          {/* Hàng 1: URL & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 p-3 rounded-lg border border-border bg-card">
              <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                1. Ô URL
              </span>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-primary font-bold break-all select-all">
                  {endpointUrl}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() => handleCopy(endpointUrl, 'url')}
                >
                  {copiedUrl ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card">
              <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                2. Method (Phương thức)
              </span>
              <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                POST
              </div>
            </div>
          </div>

          {/* Hàng 2: Headers */}
          <div className="p-3 rounded-lg border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground block">
                3. Headers (Tiêu đề) &rarr; Nhấn <b>Add new field</b>:
              </span>
              {hasKey && (
                <button
                  type="button"
                  onClick={() => handleCopy(apiKey || '', 'header')}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedHeader ? <CheckIcon className="size-3 text-emerald-500" /> : <CopyIcon className="size-3" />}
                  Sao chép giá trị Key
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-muted/40 p-2.5 rounded border border-border">
              <div>
                <span className="text-[10px] text-muted-foreground block">Key:</span>
                <b className="text-foreground select-all">x-api-key</b>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Text:</span>
                <b className="text-primary break-all select-all">
                  {apiKey || 'Vui lòng nhấn Tạo mã API Key ở trên'}
                </b>
              </div>
            </div>
          </div>

          {/* Hàng 3: Request Body */}
          <div className="p-3 rounded-lg border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground block">
                4. Request Body &rarr; Chọn định dạng <b>JSON</b> &rarr; Thêm 2 trường:
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    JSON.stringify(
                      {
                        sms: 'Shortcut Input (chọn Content)',
                        note: 'Provided Input (Ghi chú)',
                      },
                      null,
                      2
                    ),
                    'json'
                  )
                }
                className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedJson ? <CheckIcon className="size-3 text-emerald-500" /> : <CopyIcon className="size-3" />}
                Sao chép cấu trúc JSON
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-muted/40 border border-border space-y-1">
                <span className="text-[11px] font-bold text-foreground block">
                  Trường 1 (Toàn văn biên lai email):
                </span>
                <div className="font-mono text-[11px] text-muted-foreground">
                  • Key: <b className="text-foreground">sms</b> (Text)<br />
                  • Value: Chọn biến <span className="text-primary font-semibold">Shortcut Input</span> &rarr; chạm vào đổi thành <span className="text-emerald-500 font-semibold">Content</span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-muted/40 border border-border space-y-1">
                <span className="text-[11px] font-bold text-foreground block">
                  Trường 2 (Ghi chú gõ thêm từ form):
                </span>
                <div className="font-mono text-[11px] text-muted-foreground">
                  • Key: <b className="text-foreground">note</b> (Text)<br />
                  • Value: Chọn biến <span className="text-primary font-semibold">Provided Input</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HƯỚNG DẪN 2 PHẦN MẠCH LẠC, DỄ NHÌN */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <MailIcon className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Hướng dẫn thiết lập trên iPhone
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground">Thời gian thiết lập: ~2 phút</span>
        </div>

        {/* Lưu ý Gmail */}
        <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 text-xs text-muted-foreground flex items-start gap-2.5">
          <InfoIcon className="size-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <b>Về tài khoản Gmail:</b> Bạn <b>vẫn dùng app Gmail</b> đọc thư bình thường! Chỉ cần vào <i>Cài đặt iPhone &gt; Mail &gt; Tài khoản &gt; Thêm tài khoản Google</i> một lần duy nhất để iOS có quyền cấp nội dung thư cho Phím tắt khi email VCB vừa tới.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* PHẦN A: TẠO PHÍM TẮT XỬ LÝ (TAB SHORTCUTS) */}
          <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                A
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Phần 1: Tạo kịch bản xử lý (Tab Shortcuts)
              </h4>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Mở app <b>Shortcuts (Phím tắt)</b> &gt; Bấm dấu <b>+</b> góc trên phải &gt; Thêm lần lượt 3 tác vụ sau:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                <div className="flex items-center justify-between font-semibold text-foreground">
                  <span>1. Tác vụ: Ask for Input</span>
                  <span className="text-[10px] text-muted-foreground">Hỏi ghi chú</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Tìm <code>Ask for Input</code> &rarr; Lời nhắc: <i>&quot;Nhập ghi chú chi tiêu:&quot;</i> (Text).
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                <div className="flex items-center justify-between font-semibold text-foreground">
                  <span>2. Tác vụ: Get Contents of URL</span>
                  <span className="text-[10px] text-muted-foreground">Gửi về Money+</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Tìm <code>Get Contents of URL</code> &rarr; Điền URL, Method POST, Header <code>x-api-key</code> và Body JSON theo đúng bảng thông số ở trên.
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ Nhớ chạm vào biến <b>Shortcut Input</b> và đổi thành <b>Content</b>.
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                <div className="flex items-center justify-between font-semibold text-foreground">
                  <span>3. Tác vụ: Show Notification</span>
                  <span className="text-[10px] text-muted-foreground">Báo kết quả</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Tìm <code>Get Dictionary Value</code> lấy khóa <code>message</code> từ kết quả URL &rarr; Nối vào tác vụ <code>Show Notification</code> để iPhone hiện thông báo rung.
                </p>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground pt-1">
              &rarr; Bấm <b>Done</b> ở góc trên phải để lưu kịch bản.
            </p>
          </div>

          {/* PHẦN B: BẬT TỰ ĐỘNG HÓA KÍCH HOẠT (TAB AUTOMATION) */}
          <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                B
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Phần 2: Bật Tự động kích hoạt (Tab Automation)
              </h4>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Chuyển sang tab <b>Automation (Tự động hóa)</b> ở thanh dưới cùng &gt; Bấm dấu <b>+</b>:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                <div className="font-semibold text-foreground">
                  1. Chọn sự kiện: Email (Thư)
                </div>
                <div className="text-[11px] text-muted-foreground space-y-0.5 font-mono">
                  <div>• Sender: <code>VCBDigibank@info.vietcombank.com.vn</code></div>
                  <div>• Subject Contains: <code>Biên lai chuyển tiền</code></div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                <div className="font-semibold text-foreground">
                  2. Cài đặt chế độ chạy
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Chọn <b>Run Immediately (Chạy ngay lập tức)</b> và tắt công tắc <i>&quot;Notify When Run&quot;</i> để máy chạy ngầm êm ái &rarr; Bấm <b>Next</b>.
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                <div className="font-semibold text-foreground">
                  3. Nối với phím tắt ở Phần A
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Tìm tác vụ <code>Run Shortcut (Chạy phím tắt)</code> &rarr; Chọn đúng phím tắt bạn vừa tạo ở <b>Phần A</b> &rarr; Bấm <b>Done (Xong)</b>!
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2Icon className="size-3.5 shrink-0" />
              <span>Hoàn tất! Từ bây giờ mỗi khi VCB gửi email, iPhone sẽ tự động ghi sổ!</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
