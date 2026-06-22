'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Sparkles, Plus, Edit3, Trash2 } from 'lucide-react';
import type { LoveMilestoneRow } from '@/types/database';
import { OLD_ICON_MAP, LoveTheme } from '../constants';



interface MilestoneTimelineProps {
  milestones: LoveMilestoneRow[];
  isMilestonesLoading: boolean;
  theme: LoveTheme;
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

function MilestoneCardItem({
  m,
  idx,
  theme,
  handleOpenEditMilestone,
  handleDeleteMilestone,
  handlePreview,
}: MilestoneCardItemProps) {


  const displayIcon = OLD_ICON_MAP[m.icon] || m.icon || '❤️';

  // Phân tích danh sách hình ảnh
  let urls: string[] = [];
  if (m.image_url) {
    if (m.image_url.startsWith('[') && m.image_url.endsWith(']')) {
      try {
        urls = JSON.parse(m.image_url);
      } catch {
        urls = [m.image_url];
      }
    } else {
      urls = [m.image_url];
    }
  }

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
        "bg-card/70 dark:bg-card/45 backdrop-blur-md border transition-all rounded-3xl p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] space-y-3 group-hover:translate-x-1 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] dark:group-hover:shadow-[0_12px_40px_rgb(0,0,0,0.25)] duration-300 relative overflow-hidden",
        theme.borderHover
      )}>
        <div className="flex justify-between items-start gap-4">
          <div>
            {/* Milestone date - Đưa vào dạng Badge xinh xắn */}
            <span className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase mb-1.5 select-none",
              theme.bgLight,
              theme.text
            )}>
              {new Date(m.milestone_date).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </span>
            {/* Title */}
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
          <p className="text-sm text-muted-foreground/90 whitespace-pre-wrap leading-relaxed">
            {m.description}
          </p>
        )}

        {/* Gallery ảnh nghệ thuật nâng cấp */}
        {(() => {
          if (urls.length === 0) return null;

          // 1 ảnh: Tràn toàn bộ chiều rộng Card (w-full), bo tròn rounded-2xl
          if (urls.length === 1) {
            return (
              <div className="mt-3 w-full rounded-2xl overflow-hidden border border-border/40 shadow-xs hover:shadow-md transition-shadow group/img-item">
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  <Image
                    src={urls[0]}
                    alt={m.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover/img-item:scale-103 transition-transform duration-500 ease-out cursor-pointer"
                    onClick={() => handlePreview(urls, 0)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/img-item:bg-black/5 transition-colors pointer-events-none" />
                </div>
              </div>
            );
          }

          // 2 ảnh: Lưới bất đối xứng tỷ lệ vàng (60% - 40%) rất độc đáo và thu hút
          if (urls.length === 2) {
            return (
              <div className="grid grid-cols-5 gap-2 mt-3 w-full aspect-[16/10] sm:aspect-[16/9]">
                <div className="col-span-3 relative rounded-2xl overflow-hidden border border-border/40 shadow-xs hover:shadow-md transition-all group/img-item h-full">
                  <Image
                    src={urls[0]}
                    alt={`${m.title} 1`}
                    fill
                    sizes="(max-width: 768px) 60vw, 40vw"
                    className="object-cover group-hover/img-item:scale-103 transition-transform duration-500 ease-out cursor-pointer"
                    onClick={() => handlePreview(urls, 0)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/img-item:bg-black/5 transition-colors pointer-events-none" />
                </div>
                <div className="col-span-2 relative rounded-2xl overflow-hidden border border-border/40 shadow-xs hover:shadow-md transition-all group/img-item h-full">
                  <Image
                    src={urls[1]}
                    alt={`${m.title} 2`}
                    fill
                    sizes="(max-width: 768px) 40vw, 30vw"
                    className="object-cover group-hover/img-item:scale-103 transition-transform duration-500 ease-out cursor-pointer"
                    onClick={() => handlePreview(urls, 1)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/img-item:bg-black/5 transition-colors pointer-events-none" />
                </div>
              </div>
            );
          }

          // 3 ảnh: 1 ảnh lớn bên trái, 2 ảnh nhỏ bên phải xếp dọc
          if (urls.length === 3) {
            return (
              <div className="grid grid-cols-3 gap-2 mt-3 w-full aspect-[16/10] sm:aspect-[16/9]">
                {/* Ảnh lớn bên trái */}
                <div className="col-span-2 relative rounded-2xl overflow-hidden border border-border/40 shadow-xs hover:shadow-md transition-all group/img-item h-full min-h-0">
                  <Image
                    src={urls[0]}
                    alt={`${m.title} 1`}
                    fill
                    sizes="(max-width: 768px) 66vw, 50vw"
                    className="object-cover group-hover/img-item:scale-103 transition-transform duration-500 ease-out cursor-pointer"
                    onClick={() => handlePreview(urls, 0)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/img-item:bg-black/5 transition-colors pointer-events-none" />
                </div>
                {/* 2 ảnh nhỏ bên phải */}
                <div className="flex flex-col gap-2 h-full min-h-0">
                  {urls.slice(1, 3).map((url, tIdx) => (
                    <div key={tIdx} className="flex-1 relative rounded-2xl overflow-hidden border border-border/40 shadow-xs hover:shadow-md transition-all group/img-item min-h-0">
                      <Image
                        src={url}
                        alt={`${m.title} ${tIdx + 2}`}
                        fill
                        sizes="(max-width: 768px) 33vw, 25vw"
                        className="object-cover group-hover/img-item:scale-103 transition-transform duration-500 ease-out cursor-pointer"
                        onClick={() => handlePreview(urls, tIdx + 1)}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/img-item:bg-black/5 transition-colors pointer-events-none" />
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          // 4 ảnh trở lên: Layout Spotlight (1 ảnh rộng ở trên, 3 ảnh nhỏ xếp đều bên dưới)
          const spotlightUrl = urls[0];
          const thumbsUrls = urls.slice(1, 4);
          const hasMore = urls.length > 4;
          const moreCount = urls.length - 4;

          return (
            <div className="flex flex-col gap-2 mt-3 w-full">
              {/* Ảnh to Spotlight */}
              <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden border border-border/40 shadow-xs hover:shadow-md transition-all group/img-item">
                <Image
                  src={spotlightUrl}
                  alt={`${m.title} spotlight`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover/img-item:scale-103 transition-transform duration-500 ease-out cursor-pointer"
                  onClick={() => handlePreview(urls, 0)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover/img-item:bg-black/5 transition-colors pointer-events-none" />
              </div>
              {/* 3 Ảnh nhỏ bên dưới */}
              <div className="grid grid-cols-3 gap-2">
                {thumbsUrls.map((url, tIdx) => {
                  const isLast = tIdx === 2 && hasMore;
                  const realIdx = tIdx + 1;
                  return (
                    <div
                      key={tIdx}
                      className="relative aspect-square rounded-2xl overflow-hidden border border-border/40 shadow-xs hover:shadow-md transition-all group/img-item"
                    >
                      <Image
                        src={url}
                        alt={`${m.title} ${realIdx + 1}`}
                        fill
                        sizes="(max-width: 768px) 33vw, 15vw"
                        className="object-cover group-hover/img-item:scale-103 transition-transform duration-500 ease-out cursor-pointer"
                        onClick={() => handlePreview(urls, realIdx)}
                      />
                      {isLast ? (
                        <div
                          onClick={() => handlePreview(urls, realIdx)}
                          className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white cursor-pointer hover:bg-black/50 transition-colors z-10"
                        >
                          <span className="text-lg font-black">+{moreCount}</span>
                          <span className="text-[8px] font-bold tracking-wider uppercase opacity-85">ảnh khác</span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/0 group-hover/img-item:bg-black/5 transition-colors pointer-events-none" />
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
}

export function MilestoneTimeline({
  milestones,
  isMilestonesLoading,
  theme,
  handleOpenAddMilestone,
  handleOpenEditMilestone,
  handleDeleteMilestone,
  setActivePreviewUrls,
  setActivePreviewIdx,
  setZoomActive,
}: MilestoneTimelineProps) {
  const handlePreview = (urls: string[], idx: number) => {
    setActivePreviewUrls(urls);
    setActivePreviewIdx(idx);
    setZoomActive(false);
  };

  return (
    <div className="space-y-6">


      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Sparkles className={cn("size-5", theme.textRoseColor, theme.fillColor)} />
            Hành trình Kỷ niệm
          </h2>
          <p className="text-sm text-muted-foreground">
            Lưu giữ những cột mốc đặc biệt trên con đường tình yêu của hai bạn.
          </p>
        </div>
        <Button
          onClick={handleOpenAddMilestone}
          className={cn("cursor-pointer rounded-xl", theme.bg, theme.bgHover)}
          size="sm"
        >
          <Plus className="size-4 mr-1.5" />
          Thêm kỷ niệm
        </Button>
      </div>

      {/* Timeline list */}
      {isMilestonesLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : milestones.length === 0 ? (
        <div className="bg-card border rounded-2xl p-10 text-center text-muted-foreground shadow-sm">
          <Heart className={cn("size-8 mx-auto mb-3 opacity-30", theme.textRoseColor)} />
          <p className="font-medium text-sm">Chưa có cột mốc kỷ niệm nào được lưu.</p>
          <p className="text-xs mt-1">Hãy nhấp vào nút &quot;Thêm kỷ niệm&quot; để ghi lại buổi hẹn hò đầu tiên hoặc chuyến đi đáng nhớ!</p>
        </div>
      ) : (
        <div className="relative ml-4 md:ml-6 pl-6 md:pl-8 space-y-8 py-2 select-none">
          {/* Đường kẻ dọc timeline gradient mượt mà */}
          <div className={cn("absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b rounded-full opacity-60", theme.timelineLineGradient)} />

          {milestones.map((m, idx) => (
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
        </div>
      )}
    </div>
  );
}
