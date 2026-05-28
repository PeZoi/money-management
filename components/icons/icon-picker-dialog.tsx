'use client';

import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, GripHorizontalIcon, Loader2Icon } from 'lucide-react';
import { EmojiStyle, Theme } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';

// Dynamic import với ssr: false — Next.js tối ưu chunk splitting tốt hơn React.lazy
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20 text-sm text-muted-foreground gap-2">
      <Loader2Icon className="size-4 animate-spin" />
      Đang tải bộ chọn emoji…
    </div>
  ),
});

// Giới hạn kích thước resize
const MIN_WIDTH = 320;
const MAX_WIDTH = 640;
const MIN_HEIGHT = 300;
const MAX_HEIGHT = 700;
// Kích thước mặc định
const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 450;
// Chiều cao cố định cho header + padding (header ~49px + border)
const HEADER_HEIGHT = 50;

type Props = {
  value?: string;
  onChange?: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
};

/** Nút trigger + dialog chứa emoji picker (emoji-picker-react). */
export default function IconPickerDialog({ value, onChange, disabled, className }: Props) {
  const [open, setOpen] = useState(false);
  // Đánh dấu đã từng mở → giữ picker mounted trong DOM để lần sau mở lại tức thì
  const [hasOpened, setHasOpened] = useState(false);
  // Preload flag: tải trước component khi hover
  const preloaded = useRef(false);

  // Kích thước dialog — lưu bằng state để re-render picker với height mới
  const [dimensions, setDimensions] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });

  // Ref cho resize drag — dùng ref để tránh re-render liên tục trong lúc kéo
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (next && !hasOpened) {
      setHasOpened(true);
    }
  }, [hasOpened]);

  const handleEmojiClick = useCallback(
    (emojiData: EmojiClickData) => {
      onChange?.(emojiData.emoji);
      setOpen(false);
    },
    [onChange],
  );

  // Preload: khi user hover hoặc focus vào nút trigger → bắt đầu tải chunk emoji picker
  const handlePreload = useCallback(() => {
    if (preloaded.current) return;
    preloaded.current = true;
    void import('emoji-picker-react');
  }, []);

  // === Resize handlers bằng Pointer Events (mượt, hỗ trợ touch + mouse) ===
  const handleResizePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: dimensions.width,
      h: dimensions.height,
    };
    // Capture pointer để nhận events ngay cả khi chuột rời khỏi element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [dimensions]);

  const handleResizePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    // Dialog nằm giữa màn hình → nhân dx * 2 để resize đối xứng
    const newW = Math.round(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, dragStart.current.w + dx * 2)));
    const newH = Math.round(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, dragStart.current.h + dy)));

    // Cập nhật DOM trực tiếp trong lúc kéo để tránh re-render React (mượt hơn)
    if (wrapperRef.current) {
      wrapperRef.current.style.maxWidth = `${newW}px`;
      wrapperRef.current.style.height = `${newH}px`;
    }
  }, []);

  const handleResizePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    const newW = Math.round(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, dragStart.current.w + dx * 2)));
    const newH = Math.round(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, dragStart.current.h + dy)));

    // Commit kích thước cuối cùng vào state → cập nhật EmojiPicker height prop
    setDimensions({ width: newW, height: newH });
  }, []);

  // Chiều cao dành cho emoji picker = tổng chiều cao dialog - header - resize handle
  const pickerHeight = Math.max(200, dimensions.height - HEADER_HEIGHT - 28);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn('min-w-[min(100%,11rem)] justify-between gap-2 px-3', className)}
          onMouseEnter={handlePreload}
          onFocus={handlePreload}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-lg leading-none shrink-0 select-none">
              {value || '🏷️'}
            </span>
            <span className="truncate text-left text-sm">
              {value ? 'Đổi emoji' : 'Chọn emoji'}
            </span>
          </span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-60" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        showCloseButton
        fullScreenOnMobile
        className="min-w-0 gap-0 overflow-hidden p-0"
      >
        {/* Wrapper với ref để điều khiển kích thước khi resize */}
        <div
          ref={wrapperRef}
          className="flex flex-col w-full mx-auto overflow-hidden"
          style={{
            maxWidth: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
          }}
        >
          <DialogHeader className="shrink-0 border-b px-4 py-3 text-left sm:px-6">
            <DialogTitle>Chọn emoji cho danh mục</DialogTitle>
          </DialogHeader>

          {/* Vùng chứa emoji picker — chiếm toàn bộ không gian còn lại */}
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            {hasOpened && (
              <div className={cn(!open && 'hidden')}>
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  emojiStyle={EmojiStyle.NATIVE}
                  theme={Theme.LIGHT}
                  skinTonesDisabled
                  lazyLoadEmojis
                  width="100%"
                  height={pickerHeight}
                  searchPlaceholder="Tìm emoji…"
                  previewConfig={{ showPreview: false }}
                />
              </div>
            )}
          </div>

          {/* Thanh kéo resize ở cạnh dưới dialog — chỉ hiện trên desktop */}
          <div
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            className="hidden sm:flex shrink-0 items-center justify-center h-7 border-t border-border/50 bg-muted/30 cursor-ns-resize select-none touch-none hover:bg-muted/60 active:bg-muted/80 transition-colors"
            aria-label="Kéo để thay đổi kích thước"
            role="separator"
          >
            <GripHorizontalIcon className="size-4 text-muted-foreground/50" aria-hidden />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
