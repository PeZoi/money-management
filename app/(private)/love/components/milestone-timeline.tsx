'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn, getOptimizedCloudinaryUrl, isMediaVideo } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Sparkles, Plus, Edit3, Trash2, ArrowUp, ArrowDown, Play, RefreshCw } from 'lucide-react';
import type { LoveMilestoneRow } from '@/types/database';
import { OLD_ICON_MAP, LoveTheme } from '../constants';

interface MilestoneTimelineProps {
  milestones: LoveMilestoneRow[];
  isMilestonesLoading: boolean;
  theme: LoveTheme;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  handleOpenAddMilestone: () => void;
  handleOpenEditMilestone: (m: LoveMilestoneRow) => void;
  handleDeleteMilestone: (id: string) => void;
  setActivePreviewUrls: (urls: string[] | null) => void;
  setActivePreviewIdx: (idx: number) => void;
  setZoomActive: (active: boolean) => void;
}

interface MilestoneCardItemProps {
  m: LoveMilestoneRow;
  idx: number;
  theme: LoveTheme;
  handleOpenEditMilestone: (m: LoveMilestoneRow) => void;
  handleDeleteMilestone: (id: string) => void;
  handlePreview: (urls: string[], idx: number) => void;
}

interface MediaItemProps {
  url: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  sizes?: string;
}

function MediaItem({ url, alt, className, onClick, sizes = "(max-width: 768px) 100vw, 50vw" }: MediaItemProps) {
  const isVid = isMediaVideo(url);

  if (isVid) {
    return (
      <div className={cn("relative size-full group/video cursor-pointer overflow-hidden", className)} onClick={onClick}>
        <video
          src={url}
          muted
          playsInline
          preload="metadata"
          className="size-full object-cover group-hover/video:scale-103 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-black/25 group-hover/video:bg-black/35 transition-colors flex items-center justify-center">
          <div className="size-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-lg group-hover/video:scale-110 transition-transform">
            <Play className="size-4 fill-white ml-0.5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={getOptimizedCloudinaryUrl(url, { width: 800 })}
      alt={alt}
      fill
      sizes={sizes}
      className={cn("object-cover group-hover/img-item:scale-103 transition-transform duration-500 ease-out cursor-pointer", className)}
      onClick={onClick}
    />
  );
}

const MilestoneCardItem = React.memo(function MilestoneCardItem({
  m,
  idx,
  theme,
  handleOpenEditMilestone,
  handleDeleteMilestone,
  handlePreview,
}: MilestoneCardItemProps) {
  const displayIcon = OLD_ICON_MAP[m.icon] || m.icon || '❤️';

  // Phân tích danh sách hình ảnh/video (memoize để không parse JSON lại mỗi lần re-render)
  const urls = React.useMemo(() => {
    if (!m.image_url) return [];
    if (m.image_url.startsWith('[') && m.image_url.endsWith(']')) {
      try {
        return JSON.parse(m.image_url) as string[];
      } catch {
        return [m.image_url];
      }
    }
    return [m.image_url];
  }, [m.image_url]);

  return (
    <div className="relative group">
      {/* Timeline point icon wrapper - Vòng hào quang gradient */}
      <div className={cn(
        "absolute -left-[42px] md:-left-[54px] top-1.5 rounded-full border-[3px] border-background shadow-lg flex items-center justify-center size-9 md:size-11 bg-gradient-to-br p-[3.5px] transition-all group-hover:scale-110 duration-300 z-10",
        theme.timelineIconBgGradient
      )}>
        {/* Hiệu ứng Pulse nhấp nháy lan tỏa (chỉ chạy cho mốc kỷ niệm mới nhất - phần tử đầu tiên) */}
        {idx === 0 && (
          <span className={cn("absolute inset-0 rounded-full animate-ping opacity-40 scale-125 pointer-events-none", theme.bgLight)} />
        )}
        {/* Bệ đỡ emoji để tạo độ tương phản */}
        <div className="size-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-inner border border-black/5 dark:border-white/5">
          <span className="leading-none text-sm md:text-base filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]">
            {displayIcon}
          </span>
        </div>
      </div>

      {/* Card content - Glassmorphism mềm mại với bo góc rounded-3xl và shadow nổi khối */}
      <div className={cn(
        "relative rounded-3xl p-5 md:p-6 border transition-all duration-300",
        "bg-card/85 backdrop-blur-md shadow-xs hover:shadow-md",
        theme.borderHover
      )}>
        {/* Header card: Ngày & Tiêu đề & Nút thao tác */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="space-y-1">
            <span className={cn(
              "inline-flex items-center text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border",
              theme.text, theme.bgLight, theme.border
            )}>
              {new Date(m.milestone_date).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </span>
            <h3 className="text-lg font-black text-foreground tracking-tight leading-snug">{m.title}</h3>
          </div>

          {/* Action buttons (hiện khi hover vào card) */}
          <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenEditMilestone(m)}
              className="size-8 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
            >
              <Edit3 className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteMilestone(m.id)}
              className="size-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg cursor-pointer"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {m.description && (
          <p className="text-sm text-muted-foreground/90 whitespace-pre-wrap leading-relaxed mb-3">
            {m.description}
          </p>
        )}

        {/* Gallery ảnh nghệ thuật */}
        {(() => {
          if (urls.length === 0) return null;

          // 1 ảnh
          if (urls.length === 1) {
            return (
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-border/40 shadow-xs group/img-item">
                <MediaItem url={urls[0]} alt={m.title} onClick={() => handlePreview(urls, 0)} />
              </div>
            );
          }

          // 2 ảnh
          if (urls.length === 2) {
            return (
              <div className="grid grid-cols-2 gap-2 w-full aspect-[16/9]">
                {urls.map((url, i) => (
                  <div key={i} className="relative rounded-2xl overflow-hidden border border-border/40 shadow-xs group/img-item">
                    <MediaItem url={url} alt={`${m.title} ${i+1}`} onClick={() => handlePreview(urls, i)} />
                  </div>
                ))}
              </div>
            );
          }

          // 3 ảnh
          if (urls.length === 3) {
            return (
              <div className="grid grid-cols-3 gap-2 w-full aspect-[16/9]">
                <div className="col-span-2 relative rounded-2xl overflow-hidden border border-border/40 shadow-xs group/img-item">
                  <MediaItem url={urls[0]} alt={`${m.title} 1`} sizes="(max-width: 768px) 66vw, 45vw" onClick={() => handlePreview(urls, 0)} />
                </div>
                <div className="col-span-1 grid grid-rows-2 gap-2 h-full">
                  <div className="relative rounded-xl overflow-hidden border border-border/40 shadow-xs group/img-item h-full">
                    <MediaItem url={urls[1]} alt={`${m.title} 2`} sizes="(max-width: 768px) 33vw, 20vw" onClick={() => handlePreview(urls, 1)} />
                  </div>
                  <div className="relative rounded-xl overflow-hidden border border-border/40 shadow-xs group/img-item h-full">
                    <MediaItem url={urls[2]} alt={`${m.title} 3`} sizes="(max-width: 768px) 33vw, 20vw" onClick={() => handlePreview(urls, 2)} />
                  </div>
                </div>
              </div>
            );
          }

          // 4 ảnh trở lên
          const displayUrls = urls.slice(0, 4);
          const moreCount = urls.length - 4;

          return (
            <div className="mt-3 w-full">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 aspect-[2/1] sm:aspect-[16/7]">
                {displayUrls.map((url, i) => {
                  const isLastWithMore = i === 3 && moreCount > 0;
                  return (
                    <div
                      key={i}
                      className={cn("relative rounded-2xl overflow-hidden border border-border/40 shadow-xs group/img-item h-full", isLastWithMore && "cursor-pointer")}
                      onClick={() => handlePreview(urls, i)}
                    >
                      <MediaItem url={url} alt={`${m.title} ${i + 1}`} sizes="(max-width: 640px) 50vw, 25vw" />
                      {isLastWithMore && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 hover:bg-black/50 text-white backdrop-blur-[2px] transition-all">
                          <span className="text-lg font-black">+{moreCount}</span>
                          <span className="text-[8px] font-bold tracking-wider uppercase opacity-85">tệp khác</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
});

export function MilestoneTimeline({
  milestones,
  isMilestonesLoading,
  theme,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  handleOpenAddMilestone,
  handleOpenEditMilestone,
  handleDeleteMilestone,
  setActivePreviewUrls,
  setActivePreviewIdx,
  setZoomActive,
}: MilestoneTimelineProps) {
  const [sortOrder, setSortOrder] = React.useState<'desc' | 'asc'>('desc');
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Tự động kích hoạt nạp trước thêm kỷ niệm từ xa (cách đáy 800px)
  React.useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !fetchNextPage) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '800px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handlePreview = (urls: string[], idx: number) => {
    setActivePreviewUrls(urls);
    setActivePreviewIdx(idx);
    setZoomActive(false);
  };

  const sortedMilestones = React.useMemo(() => {
    return [...milestones].sort((a, b) => {
      const dateA = new Date(a.milestone_date).getTime();
      const dateB = new Date(b.milestone_date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [milestones, sortOrder]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Sparkles className={cn("size-5", theme.textRoseColor, theme.fillColor)} />
            Hành trình Kỷ niệm
          </h2>
          <p className="text-sm text-muted-foreground">Lưu giữ những cột mốc đặc biệt trên con đường tình yêu.</p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
            className="cursor-pointer rounded-xl text-xs flex items-center gap-1.5"
          >
            {sortOrder === 'desc' ? <><ArrowDown className="size-3.5" /> Mới nhất</> : <><ArrowUp className="size-3.5" /> Cũ nhất</>}
          </Button>

          <Button onClick={handleOpenAddMilestone} className={cn("cursor-pointer rounded-xl", theme.bg, theme.bgHover)} size="sm">
            <Plus className="size-4 mr-1.5" /> Thêm kỷ niệm
          </Button>
        </div>
      </div>

      {isMilestonesLoading && milestones.length === 0 ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : sortedMilestones.length === 0 ? (
        <div className="bg-card border rounded-2xl p-10 text-center text-muted-foreground shadow-sm">
          <Heart className={cn("size-8 mx-auto mb-3 opacity-30", theme.textRoseColor)} />
          <p className="font-medium text-sm">Chưa có cột mốc kỷ niệm nào được lưu.</p>
        </div>
      ) : (
        <div className="relative ml-4 md:ml-6 pl-6 md:pl-8 space-y-8 py-2 select-none">
          <div className={cn("absolute left-0 top-0 bottom-0 w-[2px] bg-linear-to-b rounded-full opacity-60", theme.timelineLineGradient)} />

          {sortedMilestones.map((m, idx) => (
            <MilestoneCardItem
              key={m.id}
              m={m}
              idx={idx}
              theme={theme}
              handleOpenEditMilestone={handleOpenEditMilestone}
              handleDeleteMilestone={handleDeleteMilestone}
              handlePreview={handlePreview}
            />
          ))}

          {/* Sentinel & Trạng thái tải thêm */}
          <div ref={sentinelRef} className="py-2 text-center min-h-[40px]">
            {isFetchingNextPage && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs font-medium text-muted-foreground animate-in fade-in">
                <RefreshCw className="size-4 animate-spin text-primary" />
                <span>Đang tải thêm kỷ niệm...</span>
              </div>
            )}
            {!hasNextPage && sortedMilestones.length > 5 && (
              <p className="py-3 text-center text-xs text-muted-foreground/60">
                Đã hiển thị toàn bộ {sortedMilestones.length} kỷ niệm
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
