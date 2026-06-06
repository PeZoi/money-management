'use client';

import * as React from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Heart, Calendar as CalendarIcon, Upload, Camera } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import type { LoveMilestoneRow } from '@/types/database';
import { MILESTONE_ICONS, LoveTheme, LoveConnection } from '../constants';
import { useMilestoneDialog } from '../hooks/use-milestone-dialog';

interface MilestoneDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  editingMilestone: LoveMilestoneRow | null;
  loveConn: LoveConnection;
  theme: LoveTheme;
}

export function MilestoneDialog({
  isOpen,
  setIsOpen,
  editingMilestone,
  loveConn,
  theme,
}: MilestoneDialogProps) {
  const dialogMilestoneImageInputRef = React.useRef<HTMLInputElement | null>(null);
  const dialogMilestoneCameraInputRef = React.useRef<HTMLInputElement | null>(null);

  const {
    milestoneTitle,
    setMilestoneTitle,
    milestoneDesc,
    setMilestoneDesc,
    milestoneDate,
    setMilestoneDate,
    milestoneIcon,
    setMilestoneIcon,
    openMilestoneCalendar,
    setOpenMilestoneCalendar,
    tempImageUrl,
    setTempImageUrl,
    milestoneImageUrls,
    setMilestoneImageUrls,
    showAllMilestoneImages,
    setShowAllMilestoneImages,
    uploadQueue,
    handleMultipleFilesUpload,
    handleMilestoneSubmit,
    isSaving
  } = useMilestoneDialog({
    loveConn,
    editingMilestone,
    isOpen,
    setIsOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md rounded-3xl h-auto max-h-[90dvh] sm:max-h-[85vh] overflow-y-auto p-5 md:p-6 space-y-5" disableScroll>
        <DialogHeader className="pb-3 border-b border-border/40 shrink-0">
          <DialogTitle className={cn("flex items-center gap-2.5", theme.text)}>
            <Heart className={cn("size-5 animate-pulse", theme.textRoseColor, theme.fillColor)} />
            {editingMilestone ? 'Chỉnh sửa Cột mốc Kỷ niệm' : 'Thêm Cột mốc Kỷ niệm'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Ghi lại một thời khắc đẹp trên hành trình yêu thương.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground/80 tracking-wider uppercase block">Tên cột mốc / Tiêu đề</label>
            <Input
              placeholder="Ví dụ: Buổi hẹn đầu tiên, Nụ hôn đầu..."
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
              className={cn("rounded-2xl h-11", theme.ringFocus)}
            />
          </div>

          {/* Date (Shadcn Date Picker) */}
          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-bold text-muted-foreground/80 tracking-wider uppercase block">Ngày diễn ra</label>
            <Popover open={openMilestoneCalendar} onOpenChange={setOpenMilestoneCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full rounded-2xl border-input px-3.5 h-11 justify-start text-left font-normal bg-card hover:bg-muted/30 focus:ring-2",
                    theme.ringFocusCalendar,
                    !milestoneDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2.5 h-4 w-4 text-muted-foreground shrink-0" />
                  {milestoneDate ? format(milestoneDate, 'dd/MM/yyyy') : <span>Chọn ngày...</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl border shadow-lg" align="start">
                <Calendar
                  mode="single"
                  selected={milestoneDate}
                  onSelect={(newDate) => {
                    if (newDate) {
                      setMilestoneDate(newDate);
                      setOpenMilestoneCalendar(false);
                    }
                  }}
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground/80 tracking-wider uppercase block">Kể lại kỷ niệm (Mô tả)</label>
            <Input
              placeholder="Bạn muốn lưu lại cảm xúc gì vào thời khắc đó?..."
              value={milestoneDesc}
              onChange={(e) => setMilestoneDesc(e.target.value)}
              className={cn("rounded-2xl h-11", theme.ringFocus)}
            />
          </div>

          {/* Image (Link or Upload) */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-muted-foreground/80 tracking-wider uppercase block">Ảnh kỷ niệm (Tối đa nhiều ảnh)</label>
            {/* Input dán URL */}
            <div className="flex gap-2">
              <Input
                placeholder="Dán link URL ảnh và nhấn Enter..."
                value={tempImageUrl}
                onChange={(e) => setTempImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (tempImageUrl.trim()) {
                      setMilestoneImageUrls(prev => [...prev, tempImageUrl.trim()]);
                      setTempImageUrl('');
                    }
                  }
                }}
                className={cn("rounded-xl flex-1 h-11 bg-background text-xs sm:text-sm", theme.ringFocus)}
              />
              {tempImageUrl.trim() && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setMilestoneImageUrls(prev => [...prev, tempImageUrl.trim()]);
                    setTempImageUrl('');
                  }}
                  className="rounded-xl cursor-pointer h-11 px-3.5"
                >
                  Thêm
                </Button>
              )}
            </div>

            {/* Chọn từ thư viện & Chụp ảnh ngay (Grid layout chia đều cực đẹp trên mobile) */}
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => dialogMilestoneImageInputRef.current?.click()}
                className="rounded-xl cursor-pointer hover:bg-muted h-11 w-full text-xs sm:text-sm font-semibold"
              >
                <Upload className="size-4 mr-1.5 shrink-0" /> Thư viện ảnh
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => dialogMilestoneCameraInputRef.current?.click()}
                className="rounded-xl cursor-pointer hover:bg-muted h-11 w-full text-xs sm:text-sm font-semibold"
              >
                <Camera className="size-4 mr-1.5 shrink-0" /> Chụp hình ngay
              </Button>

              <input
                type="file"
                ref={dialogMilestoneImageInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => handleMultipleFilesUpload(e)}
              />
              <input
                type="file"
                ref={dialogMilestoneCameraInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleMultipleFilesUpload(e)}
              />
            </div>

            {/* Hàng đợi hiển thị hàng đợi và tiến trình upload từng tệp */}
            {uploadQueue.length > 0 && (
              <div className="space-y-2.5 mt-3 p-3 border rounded-2xl bg-muted/10 divide-y divide-border/50">
                <div className="text-[11px] font-bold text-muted-foreground/80 pb-1 flex justify-between items-center tracking-wide">
                  <span>ĐANG TẢI LÊN ({uploadQueue.filter(q => q.status === 'completed').length}/{uploadQueue.length})</span>
                  {uploadQueue.some(q => q.status === 'uploading' || q.status === 'pending') && (
                    <span className="animate-pulse text-rose-500 text-[10px] font-bold">Vui lòng không đóng cửa sổ...</span>
                  )}
                </div>
                {uploadQueue.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 pt-2.5 first:pt-0">
                    {/* Thumbnail xem trước tạm thời */}
                    <div className="relative size-10 rounded-xl overflow-hidden border shrink-0 bg-muted/50">
                      {item.previewUrl && (
                        <Image
                          src={item.previewUrl}
                          alt="Preview"
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      )}
                      {item.status === 'uploading' && (
                        <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                          <span className="text-[9px] text-white font-black">{item.progress}%</span>
                        </div>
                      )}
                      {item.status === 'completed' && (
                        <div className="absolute inset-0 bg-emerald-500/80 flex items-center justify-center">
                          <span className="text-xs text-white font-extrabold">✓</span>
                        </div>
                      )}
                      {item.status === 'error' && (
                        <div className="absolute inset-0 bg-destructive/80 flex items-center justify-center">
                          <span className="text-xs text-white font-extrabold">✕</span>
                        </div>
                      )}
                    </div>

                    {/* Chi tiết file và thanh tiến trình */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2 mb-1">
                        <p className="text-xs font-bold truncate text-foreground/90">{item.fileName}</p>
                        <span className={cn(
                          "text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider",
                          item.status === 'completed' && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400",
                          item.status === 'uploading' && "bg-sky-50 text-sky-600 dark:bg-sky-950/20 dark:text-sky-400",
                          item.status === 'pending' && "bg-muted text-muted-foreground",
                          item.status === 'error' && "bg-destructive/10 text-destructive"
                        )}>
                          {item.status === 'completed' && 'Hoàn thành'}
                          {item.status === 'uploading' && `Tải... ${item.progress}%`}
                          {item.status === 'pending' && 'Đang chờ'}
                          {item.status === 'error' && 'Thất bại'}
                        </span>
                      </div>
                      {/* Thanh progress bar */}
                      <div className="w-full h-1.5 bg-muted dark:bg-muted/40 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300 ease-out",
                            item.status === 'completed' && "bg-emerald-500",
                            item.status === 'uploading' && theme.bg.split(' ')[0],
                            item.status === 'error' && "bg-destructive"
                          )}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Danh sách ảnh đã chọn */}
            {milestoneImageUrls.length > 0 && (
              <div className="space-y-2 mt-3 select-none">
                <div className="flex justify-between items-center text-xs font-bold text-muted-foreground/80 pl-1 tracking-wide">
                  <span>ẢNH ĐÃ CHỌN ({milestoneImageUrls.length})</span>
                  {milestoneImageUrls.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setShowAllMilestoneImages(!showAllMilestoneImages)}
                      className={cn("hover:underline cursor-pointer text-[10px] uppercase font-bold", theme.textRoseColor)}
                    >
                      {showAllMilestoneImages ? "Thu gọn" : "Xem tất cả"}
                    </button>
                  )}
                </div>

                {(() => {
                  const total = milestoneImageUrls.length;

                  if (total <= 4 || showAllMilestoneImages) {
                    return (
                      <div className="grid grid-cols-4 gap-2.5 p-2 border rounded-2xl bg-muted/10">
                        {milestoneImageUrls.map((url, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border bg-background group/thumb">
                            <Image
                              src={url}
                              alt={`Preview ${idx + 1}`}
                              fill
                              sizes="(max-width: 768px) 25vw, 100px"
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setMilestoneImageUrls(prev => prev.filter((_, i) => i !== idx));
                              }}
                              className={cn("absolute top-1 right-1 size-5 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer transition-colors", theme.bg, theme.bgHover)}
                              title="Xóa ảnh này"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  const displayUrls = milestoneImageUrls.slice(0, 4);
                  const moreCount = total - 4;

                  return (
                    <div className="grid grid-cols-4 gap-2.5 p-2 border rounded-2xl bg-muted/10">
                      {displayUrls.map((url, idx) => {
                        const isLast = idx === 3;

                        return (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border bg-background group/thumb">
                            <Image
                              src={url}
                              alt={`Preview ${idx + 1}`}
                              fill
                              sizes="(max-width: 768px) 25vw, 100px"
                              className="object-cover"
                            />

                            {isLast ? (
                              <div
                                onClick={() => setShowAllMilestoneImages(true)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white cursor-pointer hover:bg-black/50 transition-colors"
                              >
                                <span className="text-sm font-black">+{moreCount}</span>
                                <span className="text-[8px] font-bold tracking-wider uppercase opacity-85">ảnh khác</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setMilestoneImageUrls(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className={cn("absolute top-1 right-1 size-5 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer transition-colors", theme.bg, theme.bgHover)}
                                title="Xóa ảnh này"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Icon Choice */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground/80 tracking-wider uppercase block mb-1">Chọn biểu tượng</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {MILESTONE_ICONS.map((i) => {
                const isSelected = milestoneIcon === i.name;
                return (
                  <button
                    key={i.name}
                    type="button"
                    onClick={() => setMilestoneIcon(i.name)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs gap-1.5 transition-all cursor-pointer",
                      isSelected
                        ? `${theme.border.split(' ')[0]} border-current ${theme.bgLight} ${theme.text} font-bold`
                        : 'border-muted hover:bg-muted/40 text-muted-foreground'
                    )}
                  >
                    <span className="text-lg leading-none">{i.name}</span>
                    <span className="scale-90 font-medium">{i.label}</span>
                  </button>
                );
              })}

              {/* Emoji Picker Button */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs gap-1.5 transition-all cursor-pointer sm:col-span-2",
                      !MILESTONE_ICONS.some(i => i.name === milestoneIcon)
                        ? `${theme.border.split(' ')[0]} border-current ${theme.bgLight} ${theme.text} font-bold`
                        : 'border-muted hover:bg-muted/40 text-muted-foreground'
                    )}
                  >
                    <span className="text-lg leading-none">
                      {!MILESTONE_ICONS.some(i => i.name === milestoneIcon) ? milestoneIcon : "🤩"}
                    </span>
                    <span className="scale-90 font-medium">
                      {!MILESTONE_ICONS.some(i => i.name === milestoneIcon) ? "Emoji đã chọn" : "Chọn Emoji..."}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-none shadow-2xl z-99999" align="center">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setMilestoneIcon(emojiData.emoji);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-border/40 flex flex-row items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1 sm:flex-none rounded-xl cursor-pointer hover:bg-muted/80 h-10 px-4"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleMilestoneSubmit}
            disabled={
              isSaving ||
              !milestoneTitle ||
              !milestoneDate ||
              uploadQueue.some(item => item.status === 'uploading' || item.status === 'pending')
            }
            className={cn("flex-1 sm:flex-none shadow-sm hover:shadow transition-all rounded-xl cursor-pointer h-10 px-5", theme.bg, theme.bgHover)}
          >
            {isSaving
              ? 'Đang lưu...'
              : uploadQueue.some(item => item.status === 'uploading' || item.status === 'pending')
                ? 'Đang tải ảnh...'
                : 'Lưu kỷ niệm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
