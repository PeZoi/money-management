'use client';

import * as React from 'react';
import { m } from 'framer-motion';
import { staggerContainer, scaleIn } from '@/lib/motion-variants';
import { useLovePage } from './hooks/use-love-page';
import { THEMES } from './constants';
import { Heart, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Import các subcomponents
import { HeartbeatCard } from './components/heartbeat-card';
import { MilestoneTimeline } from './components/milestone-timeline';
import { EditAnniversaryDialog } from './components/edit-anniversary-dialog';
import { MilestoneDialog } from './components/milestone-dialog';
import { CustomizeDialog } from './components/customize-dialog';
import { Lightbox } from './components/lightbox';

export default function LovePage() {
  const {
    user,
    loveConn,
    isConnLoading,
    milestones,
    isMilestonesLoading,
    isEditAnniversaryOpen,
    setIsEditAnniversaryOpen,
    isMilestoneDialogOpen,
    setIsMilestoneDialogOpen,
    editingMilestone,
    isCustomizeDialogOpen,
    setIsCustomizeDialogOpen,
    loveTheme,
    activePreviewUrls,
    setActivePreviewUrls,
    activePreviewIdx,
    setActivePreviewIdx,
    zoomActive,
    setZoomActive,
    showFab,
    handleOpenCustomize,
    handleOpenAddMilestone,
    handleOpenEditMilestone,
    handleDeleteMilestone,
    handleOpenEditAnniversary,
  } = useLovePage();

  // Render trạng thái loading
  if (isConnLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  // Render trạng thái chưa bắt cặp
  if (!loveConn) {
    return (
      <div className="container max-w-xl mx-auto p-4 md:p-12 text-center space-y-6 mt-12">
        <div className="bg-card border rounded-2xl p-8 shadow-sm flex flex-col items-center gap-4">
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full animate-bounce">
            <Heart className="size-12 fill-current animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold">Chưa kết nối tình yêu</h2>
          <p className="text-muted-foreground">
            Tính năng này dành riêng cho các cặp đôi. Hiện tại tài khoản của bạn chưa được kết nối với ai.
          </p>
          <div className="p-4 bg-muted/50 rounded-lg text-sm text-left border w-full">
            <p className="font-semibold text-foreground mb-1">Cách kích hoạt:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
              <li>Người yêu của bạn cần đăng ký tài khoản trên hệ thống.</li>
              <li>Liên hệ với Admin hệ thống và gửi email của cả hai người.</li>
              <li>Admin sẽ bắt cặp và chức năng đếm ngày yêu sẽ xuất hiện!</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Định nghĩa màu sắc theo theme cấu hình
  const theme = THEMES[loveTheme] || THEMES.rose;

  return (
    <m.div 
      className="container max-w-4xl mx-auto p-4 md:p-8 space-y-8"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
    >
      <m.div variants={scaleIn}>
        <HeartbeatCard
          loveConn={loveConn}
          user={user}
          theme={theme}
          handleOpenCustomize={handleOpenCustomize}
          handleOpenEditAnniversary={handleOpenEditAnniversary}
        />
      </m.div>

      <m.div variants={scaleIn}>
        <MilestoneTimeline
          milestones={milestones}
          isMilestonesLoading={isMilestonesLoading}
          theme={theme}
          handleOpenAddMilestone={handleOpenAddMilestone}
          handleOpenEditMilestone={handleOpenEditMilestone}
          handleDeleteMilestone={handleDeleteMilestone}
          setActivePreviewUrls={setActivePreviewUrls}
          setActivePreviewIdx={setActivePreviewIdx}
          setZoomActive={setZoomActive}
        />
      </m.div>

      <EditAnniversaryDialog
        isOpen={isEditAnniversaryOpen}
        setIsOpen={setIsEditAnniversaryOpen}
        loveConn={loveConn}
        theme={theme}
      />

      <MilestoneDialog
        isOpen={isMilestoneDialogOpen}
        setIsOpen={setIsMilestoneDialogOpen}
        editingMilestone={editingMilestone}
        loveConn={loveConn}
        theme={theme}
      />

      <CustomizeDialog
        isOpen={isCustomizeDialogOpen}
        setIsOpen={setIsCustomizeDialogOpen}
        loveConn={loveConn}
        theme={theme}
      />

      {/* EXTENDED FLOATING ACTION BUTTON (FAB) - STICKY ADD MILESTONE BUTTON */}
      {/* Đặt bottom-24 và z-50 trên mobile để nút nổi lên trên thanh Bottom Navigation (z-40) */}
      <button
        onClick={handleOpenAddMilestone}
        className={cn(
          "fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50",
          "flex items-center justify-center gap-2 h-10 w-36 rounded-full cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out group border border-white/10 px-4",
          theme.bg,
          theme.bgHover,
          showFab ? "translate-y-0 opacity-100 scale-100" : "translate-y-16 opacity-0 scale-75 pointer-events-none"
        )}
        title="Thêm kỷ niệm mới"
      >
        <Plus className="size-4.5 shrink-0 transition-transform duration-300 group-hover:rotate-90" />
        <span className="text-xs font-bold whitespace-nowrap select-none">
          Thêm kỷ niệm
        </span>
      </button>

      <Lightbox
        activePreviewUrls={activePreviewUrls}
        setActivePreviewUrls={setActivePreviewUrls}
        activePreviewIdx={activePreviewIdx}
        setActivePreviewIdx={setActivePreviewIdx}
        zoomActive={zoomActive}
        setZoomActive={setZoomActive}
      />
    </m.div>
  );
}
