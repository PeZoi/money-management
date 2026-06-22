'use client';

import * as React from 'react';
import {
  useMyLoveConnection,
  useLoveMilestones,
  useLoveMutation
} from '@/hooks/use-love';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import type { LoveMilestoneRow } from '@/types/database';
export type LoveThemeType = 'rose' | 'primary' | 'ocean' | 'lavender' | 'sunset';

export function useLovePage() {
  const { user } = useAuth();
  const { data: loveConn, isLoading: isConnLoading } = useMyLoveConnection();
  const { data: milestones = [], isLoading: isMilestonesLoading } = useLoveMilestones(
    loveConn?.connection_id
  );

  const { deleteMilestone, isDeletingMilestone } = useLoveMutation();

  // State Dialog sửa ngày kỷ niệm
  const [isEditAnniversaryOpen, setIsEditAnniversaryOpen] = React.useState(false);

  // State Dialog Cột mốc (Thêm/Sửa)
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = React.useState(false);
  const [editingMilestone, setEditingMilestone] = React.useState<LoveMilestoneRow | null>(null);

  // State Dialog Tùy chỉnh giao diện
  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = React.useState(false);

  // States cho Lightbox Preview ảnh
  const [activePreviewUrls, setActivePreviewUrls] = React.useState<string[] | null>(null);
  const [activePreviewIdx, setActivePreviewIdx] = React.useState<number>(0);
  const [zoomActive, setZoomActive] = React.useState(false);

  // State ẩn/hiện nút "Thêm kỷ niệm" Sticky (FAB)
  const [showFab, setShowFab] = React.useState(false);

  // Theo dõi scroll để ẩn/hiện nút FAB thêm kỷ niệm
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setShowFab(true);
      } else {
        setShowFab(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mở Dialog tùy chỉnh
  const handleOpenCustomize = () => {
    setIsCustomizeDialogOpen(true);
  };

  // Mở Dialog thêm cột mốc
  const handleOpenAddMilestone = () => {
    setEditingMilestone(null);
    setIsMilestoneDialogOpen(true);
  };

  // Mở Dialog sửa cột mốc
  const handleOpenEditMilestone = (m: LoveMilestoneRow) => {
    setEditingMilestone(m);
    setIsMilestoneDialogOpen(true);
  };

  // State quản lý Confirm Dialog xóa cột mốc
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  // Xóa cột mốc (khi người dùng bấm xác nhận ở Dialog)
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId || !loveConn) return;
    try {
      await deleteMilestone({ id: deleteConfirmId, connectionId: loveConn.connection_id });
      toast.success('Xóa mốc kỷ niệm thành công!');
    } catch (err) {
      console.error(err);
      toast.error('Xóa mốc kỷ niệm thất bại.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleDeleteMilestone = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleOpenEditAnniversary = () => {
    setIsEditAnniversaryOpen(true);
  };

  // Computed properties
  const myName = user?.displayName || 'Tôi';
  const partnerName = loveConn?.partner_name || 'Người ấy';
  const loveTheme = (loveConn?.theme as LoveThemeType) || 'rose';

  return {
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
    setEditingMilestone,
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
    isDeletingMilestone,
    deleteConfirmId,
    setDeleteConfirmId,
    handleConfirmDelete,
    myName,
    partnerName
  };
}
