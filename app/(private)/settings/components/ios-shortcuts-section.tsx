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
  CheckCircle2Icon,
  Loader2Icon,
  LightbulbIcon,
  ZapIcon,
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
  - sms: (Biến Text from Image từ bước Extract text)
  - note: (Biến Provided Input từ bước Ask for Input)`;

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
          Ngay sau khi chuyển khoản thành công trên bất kỳ app ngân hàng nào (Vietcombank, Techcombank, MB, Momo...), chỉ cần <b>gõ 2 lần vào mặt lưng iPhone</b>: máy sẽ tự chụp màn hình biên lai, trích xuất chữ (OCR) và hiện ô nhập nhanh ghi chú. AI sẽ tự động phân tích số tiền, danh mục và lưu chi tiêu tức thì!
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
              Mã xác thực bảo mật giúp iPhone gửi giao dịch an toàn vào tài khoản của bạn.
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
                Thông số tác vụ &quot;Get Contents of URL&quot; (Copy nhanh)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Mở tác vụ <b>Get Contents of URL (Lấy nội dung từ URL)</b> và cấu hình chuẩn theo các mục sau:
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
                3. Headers (Tiêu đề) &rarr; Bấm <b>Add new field</b>:
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
                        sms: 'Text from Image (Biến chữ quét từ ảnh)',
                        note: 'Provided Input (Biến ghi chú nhập tay)',
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
                  Trường 1 (Chữ quét từ ảnh chụp màn hình):
                </span>
                <div className="font-mono text-[11px] text-muted-foreground">
                  • Key: <b className="text-foreground">sms</b> (Text)<br />
                  • Value: Chọn biến <span className="text-primary font-semibold">Text from Image</span> (từ bước 2)
                </div>
              </div>

              <div className="p-2.5 rounded bg-muted/40 border border-border space-y-1">
                <span className="text-[11px] font-bold text-foreground block">
                  Trường 2 (Ghi chú nhập từ popup):
                </span>
                <div className="font-mono text-[11px] text-muted-foreground">
                  • Key: <b className="text-foreground">note</b> (Text)<br />
                  • Value: Chọn biến <span className="text-primary font-semibold">Provided Input</span> (từ bước 4)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HƯỚNG DẪN CHI TIẾT 2 BƯỚC */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <ZapIcon className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Hướng dẫn thiết lập 2 bước trên iPhone
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">Thời gian thiết lập: ~2 phút</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* BƯỚC 1: TẠO PHÍM TẮT TRONG TAB SHORTCUTS */}
          <div className="space-y-3.5 p-4 rounded-xl border border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                1
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Bước 1: Tạo Phím tắt xử lý (Tab Shortcuts)
              </h4>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Mở app <b>Phím tắt (Shortcuts)</b> &gt; Bấm dấu <b>+</b> góc trên phải &gt; Thêm lần lượt 7 khối hành động chuẩn theo thứ tự sau:
            </p>

            <div className="space-y-2 text-xs">
              {/* Hành động 1 */}
              <div className="p-2.5 rounded-lg border border-border bg-card flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground mt-0.5">
                  1
                </span>
                <div className="space-y-0.5 flex-1">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>Take screenshot</span>
                    <span className="text-[10px] text-muted-foreground">Chụp màn hình</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tìm <code>Take screenshot</code> để chụp màn hình biên lai đang hiển thị.
                  </p>
                </div>
              </div>

              {/* Hành động 2 */}
              <div className="p-2.5 rounded-lg border border-border bg-card flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground mt-0.5">
                  2
                </span>
                <div className="space-y-0.5 flex-1">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>Extract text from Screenshot</span>
                    <span className="text-[10px] text-muted-foreground">Quét chữ OCR</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tìm <code>Extract text from Image</code> &rarr; Chọn đầu vào là <code>Screenshot</code>.
                  </p>
                </div>
              </div>

              {/* Hành động 3 */}
              <div className="p-2.5 rounded-lg border border-border bg-card flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground mt-0.5">
                  3
                </span>
                <div className="space-y-0.5 flex-1">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>Delete Screenshot</span>
                    <span className="text-[10px] text-muted-foreground">Xóa ảnh đã quét</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tìm <code>Delete Photos</code> &rarr; Chọn xóa biến <code>Screenshot</code> để không đầy bộ nhớ.
                  </p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    💡 Mở rộng mũi tên ở khối Delete và <b>Tắt &quot;Confirm Before Deleting&quot;</b> để máy tự xóa ngầm không cần hỏi lại.
                  </p>
                </div>
              </div>

              {/* Hành động 4 */}
              <div className="p-2.5 rounded-lg border border-border bg-card flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground mt-0.5">
                  4
                </span>
                <div className="space-y-0.5 flex-1">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>Ask for Text with Nhập ghi chú</span>
                    <span className="text-[10px] text-muted-foreground">Popup ghi chú</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tìm <code>Ask for Input</code> &rarr; Kiểu <i>Text</i>, lời nhắc: <i>&quot;Nhập ghi chú&quot;</i>.
                  </p>
                </div>
              </div>

              {/* Hành động 5 */}
              <div className="p-2.5 rounded-lg border border-border bg-card flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground mt-0.5">
                  5
                </span>
                <div className="space-y-0.5 flex-1">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>Get contents of URL</span>
                    <span className="text-[10px] text-muted-foreground">Gửi về hệ thống</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tìm <code>Get contents of URL</code> &rarr; Điền theo đúng bảng thông số bên trên (Method POST, Header <code>x-api-key</code>, Body JSON chứa <code>sms</code> và <code>note</code>).
                  </p>
                </div>
              </div>

              {/* Hành động 6 */}
              <div className="p-2.5 rounded-lg border border-border bg-card flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground mt-0.5">
                  6
                </span>
                <div className="space-y-0.5 flex-1">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>Get Value for message in Contents of URL</span>
                    <span className="text-[10px] text-muted-foreground">Bóc thông báo</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tìm <code>Get Dictionary Value</code> &rarr; Lấy giá trị cho key <code>message</code> từ <code>Contents of URL</code>.
                  </p>
                </div>
              </div>

              {/* Hành động 7 */}
              <div className="p-2.5 rounded-lg border border-border bg-card flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground mt-0.5">
                  7
                </span>
                <div className="space-y-0.5 flex-1">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>Show notification</span>
                    <span className="text-[10px] text-muted-foreground">Báo kết quả</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tìm <code>Show notification</code> &rarr; Gắn biến <code>Dictionary Value</code> để iPhone báo rung và hiển thị kết quả ghi chi tiêu.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground pt-1">
              &rarr; Đổi tên phím tắt (ví dụ: <b>Ghi chi tiêu</b>) rồi bấm <b>Xong (Done)</b> để lưu lại.
            </p>
          </div>

          {/* BƯỚC 2: GÁN VÀO CHẠM MẶT LƯNG (BACK TAP) */}
          <div className="space-y-3.5 p-4 rounded-xl border border-border bg-muted/20 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                  2
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Bước 2: Gán vào Gõ mặt lưng (Back Tap)
                </h4>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Để kích hoạt phím tắt chỉ bằng 1 thao tác gõ sau lưng máy, bạn thiết lập trong Cài đặt iPhone như sau:
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <div className="font-semibold text-foreground">
                    1. Mở Cài đặt hệ thống (Settings)
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Cài đặt &gt; Trợ năng (Accessibility) &gt; Cảm ứng (Touch)
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <div className="font-semibold text-foreground">
                    2. Chọn Chạm vào mặt sau (Back Tap)
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Cuộn xuống dưới cùng của trang Cảm ứng, chọn mục <b>Chạm vào mặt sau (Back Tap)</b>.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                  <div className="font-semibold text-foreground">
                    3. Gán phím tắt vào Chạm hai lần (Double Tap)
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Bấm vào <b>Chạm hai lần (Double Tap)</b> &rarr; Cuộn xuống nhóm danh sách <i>Phím tắt (Shortcuts)</i> và tích chọn đúng phím tắt bạn vừa tạo ở Bước 1!
                  </p>
                </div>
              </div>

              {/* Mẹo sử dụng thực tế */}
              <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 text-xs text-muted-foreground space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <LightbulbIcon className="size-4 text-blue-500 shrink-0" />
                  <span>Cách sử dụng thực tế siêu nhanh:</span>
                </div>
                <ul className="text-[11px] leading-relaxed list-disc list-inside space-y-1">
                  <li>Chuyển khoản xong trên app ngân hàng (màn hình đang hiện thông báo chuyển thành công).</li>
                  <li>Dùng ngón tay gõ nhẹ <b>2 lần</b> vào mặt lưng iPhone.</li>
                  <li>Nhập ghi chú vào popup nảy lên (VD: <i>&quot;tiền ăn trưa&quot;</i>, <i>&quot;cafe bạn bè&quot;</i>) và bấm Xong.</li>
                  <li>Hệ thống AI sẽ tự đọc số tiền, phân loại danh mục và lưu ngay tức thì!</li>
                </ul>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-medium mt-3">
              <CheckCircle2Icon className="size-4 shrink-0" />
              <span>Thiết lập hoàn tất! Bắt đầu trải nghiệm ghi chép chi tiêu 1-chạm cực kỳ tiện lợi!</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
