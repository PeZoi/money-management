'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { useLoveMutation } from '@/hooks/use-love';
import { toast } from 'sonner';
import type { LoveMilestoneRow } from '@/types/database';
import { LoveConnection } from '../constants';

export interface UploadQueueItem {
  id: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  previewUrl?: string;
}

interface UseMilestoneDialogProps {
  loveConn: LoveConnection;
  editingMilestone: LoveMilestoneRow | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function useMilestoneDialog({
  loveConn,
  editingMilestone,
  isOpen,
  setIsOpen,
}: UseMilestoneDialogProps) {
  const { createMilestone, updateMilestone, uploadLoveAsset, isCreatingMilestone, isUpdatingMilestone } = useLoveMutation();

  const [milestoneTitle, setMilestoneTitle] = React.useState('');
  const [milestoneDesc, setMilestoneDesc] = React.useState('');
  const [milestoneDate, setMilestoneDate] = React.useState<Date | undefined>(new Date());
  const [milestoneIcon, setMilestoneIcon] = React.useState('❤️');
  const [openMilestoneCalendar, setOpenMilestoneCalendar] = React.useState(false);

  const [tempImageUrl, setTempImageUrl] = React.useState('');
  const [milestoneImageUrls, setMilestoneImageUrls] = React.useState<string[]>([]);
  const [showAllMilestoneImages, setShowAllMilestoneImages] = React.useState(false);
  const [uploadQueue, setUploadQueue] = React.useState<UploadQueueItem[]>([]);

  // Đổ dữ liệu cũ hoặc reset khi đóng mở Dialog
  React.useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (editingMilestone) {
        setMilestoneTitle(editingMilestone.title);
        setMilestoneDesc(editingMilestone.description || '');
        setMilestoneDate(new Date(editingMilestone.milestone_date));
        setMilestoneIcon(editingMilestone.icon || '❤️');

        let urls: string[] = [];
        if (editingMilestone.image_url) {
          if (editingMilestone.image_url.startsWith('[') && editingMilestone.image_url.endsWith(']')) {
            try {
              urls = JSON.parse(editingMilestone.image_url);
            } catch {
              urls = [editingMilestone.image_url];
            }
          } else {
            urls = [editingMilestone.image_url];
          }
        }
        setMilestoneImageUrls(urls);
      } else {
        setMilestoneTitle('');
        setMilestoneDesc('');
        setMilestoneDate(new Date());
        setMilestoneIcon('❤️');
        setMilestoneImageUrls([]);
      }
      setShowAllMilestoneImages(false);
      setTempImageUrl('');
      setOpenMilestoneCalendar(false);
      setUploadQueue([]);
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, editingMilestone]);

  // Upload nhiều file hình ảnh song song cho cột mốc kỷ niệm với hàng đợi và tiến trình riêng
  const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !loveConn) return;

    if (!milestoneTitle.trim()) {
      toast.error('Vui lòng nhập tên cột mốc kỷ niệm trước khi tải ảnh lên.');
      e.target.value = '';
      return;
    }

    const newItems: UploadQueueItem[] = [];
    const filesToUpload: { file: File; id: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = Math.random().toString(36).substring(2, 9);

      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} không phải là ảnh.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} vượt quá dung lượng 5MB.`);
        continue;
      }

      newItems.push({
        id,
        fileName: file.name,
        progress: 0,
        status: 'pending',
        previewUrl: URL.createObjectURL(file)
      });
      filesToUpload.push({ file, id });
    }

    if (newItems.length === 0) return;

    setUploadQueue(prev => [...prev, ...newItems]);

    const uploadSingleFile = async (fileObj: { file: File; id: string }) => {
      const { file, id } = fileObj;
      let fakeProgressInterval: NodeJS.Timeout | null = null;

      setUploadQueue(prev => prev.map(item =>
        item.id === id ? { ...item, status: 'uploading', progress: 0 } : item
      ));

      try {
        const res = await uploadLoveAsset({
          file,
          type: 'milestone',
          connectionId: loveConn.connection_id,
          milestoneTitle: milestoneTitle.trim(),
          onProgress: (percent) => {
            const scaledPercent = Math.round(percent * 0.85);

            setUploadQueue(prev => prev.map(item =>
              item.id === id ? { ...item, progress: scaledPercent } : item
            ));

            if (percent === 100 && !fakeProgressInterval) {
              let fakeProgress = 85;
              fakeProgressInterval = setInterval(() => {
                if (fakeProgress < 99) {
                  fakeProgress += Math.random() > 0.5 ? 1 : 2;
                  if (fakeProgress > 99) fakeProgress = 99;

                  setUploadQueue(prev => prev.map(item =>
                    item.id === id ? { ...item, progress: fakeProgress } : item
                  ));
                }
              }, 300);
            }
          }
        });

        if (fakeProgressInterval) {
          clearInterval(fakeProgressInterval);
        }

        setUploadQueue(prev => prev.map(item =>
          item.id === id ? { ...item, status: 'completed', progress: 100 } : item
        ));

        setMilestoneImageUrls(prev => [...prev, res.url]);

        setTimeout(() => {
          setUploadQueue(prev => {
            const item = prev.find(i => i.id === id);
            if (item?.previewUrl) {
              URL.revokeObjectURL(item.previewUrl);
            }
            return prev.filter(i => i.id !== id);
          });
        }, 1500);

      } catch (err) {
        if (fakeProgressInterval) {
          clearInterval(fakeProgressInterval);
        }
        console.error(err);

        setUploadQueue(prev => prev.map(item =>
          item.id === id ? { ...item, status: 'error', progress: 0 } : item
        ));

        setTimeout(() => {
          setUploadQueue(prev => {
            const item = prev.find(i => i.id === id);
            if (item?.previewUrl) {
              URL.revokeObjectURL(item.previewUrl);
            }
            return prev.filter(i => i.id !== id);
          });
        }, 4000);
      }
    };

    await Promise.all(filesToUpload.map(f => uploadSingleFile(f)));
    e.target.value = '';
  };

  // Submit Cột mốc (Thêm hoặc Sửa)
  const handleMilestoneSubmit = async () => {
    if (!loveConn || !milestoneTitle || !milestoneDate) return;

    try {
      const imageUrlPayload = milestoneImageUrls.length > 0 ? JSON.stringify(milestoneImageUrls) : null;

      if (editingMilestone) {
        await updateMilestone({
          id: editingMilestone.id,
          connectionId: loveConn.connection_id,
          title: milestoneTitle,
          description: milestoneDesc,
          milestoneDate: format(milestoneDate, 'yyyy-MM-dd'),
          icon: milestoneIcon,
          imageUrl: imageUrlPayload,
        });
        toast.success('Cập nhật mốc kỷ niệm thành công!');
      } else {
        await createMilestone({
          connectionId: loveConn.connection_id,
          title: milestoneTitle,
          description: milestoneDesc,
          milestoneDate: format(milestoneDate, 'yyyy-MM-dd'),
          icon: milestoneIcon,
          imageUrl: imageUrlPayload,
        });
        toast.success('Ghi nhận mốc kỷ niệm mới thành công!');
      }
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Lưu kỷ niệm thất bại.');
    }
  };

  return {
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
    isSaving: isCreatingMilestone || isUpdatingMilestone
  };
}
