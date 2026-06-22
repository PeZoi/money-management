'use client';

import * as React from 'react';
import { m } from 'framer-motion';
import { staggerContainer, scaleIn } from '@/lib/motion-variants';
import { useLovePage } from './hooks/use-love-page';
import { THEMES } from './constants';
import { Heart, Plus, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

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
    deleteConfirmId,
    setDeleteConfirmId,
    handleConfirmDelete,
    isDeletingMilestone,
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

      {/* Confirm Dialog xóa cột mốc kỷ niệm */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-[360px] p-6 rounded-3xl" disableMobileDrawer showCloseButton={false}>
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Icon cảnh báo nổi bật */}
            <div className="size-14 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center border border-rose-100 dark:border-rose-900/20 text-rose-500 animate-pulse">
              <Trash2 className="size-7" />
            </div>
            
            {/* Tiêu đề & Mô tả */}
            <div className="space-y-1.5">
              <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                Xác nhận xóa kỷ niệm
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs leading-relaxed max-w-[280px] mx-auto">
                Bạn có chắc chắn muốn xóa mốc kỷ niệm này? Hành động này sẽ không thể khôi phục và hình ảnh liên quan sẽ được tự động dọn dẹp sau 24 giờ.
              </DialogDescription>
            </div>

            {/* Các nút hành động chia đôi cân xứng */}
            <div className="grid grid-cols-2 gap-3 w-full pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-2xl cursor-pointer py-4 text-xs font-semibold"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={isDeletingMilestone}
                className="bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white rounded-2xl cursor-pointer py-4 text-xs font-semibold border-none shadow-md shadow-rose-500/10"
              >
                {isDeletingMilestone ? "Đang xóa..." : "Xác nhận xóa"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
