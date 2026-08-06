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
  const [shouldCompressImages, setShouldCompressImages] = React.useState(true);

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

  // Định nghĩa hàm nén ảnh bằng canvas
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const MAX_WIDTH = 1920;
          let w = img.width;
          let h = img.height;
          if (w > MAX_WIDTH) {
            h = Math.round((h * MAX_WIDTH) / w);
            w = MAX_WIDTH;
          }
          canvas.width = w;
          canvas.height = h;
          ctx?.drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
            } else {
              resolve(file);
            }
          }, "image/jpeg", 0.85); // Nén chất lượng 85%
        };
      };
      reader.onerror = () => resolve(file);
    });
  };

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

    // Nén ảnh song song trước khi đưa vào hàng đợi
    const processPromises = Array.from(files).map(async (file) => {
      const id = Math.random().toString(36).substring(2, 9);
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        toast.error(`File ${file.name} không phải là ảnh hoặc video hợp lệ.`);
        return;
      }

      let fileToUpload = file;
      if (isImage && shouldCompressImages) {
        try {
          fileToUpload = await compressImage(file);
        } catch (err) {
          console.error(`Không thể nén ảnh ${file.name}, sử dụng ảnh gốc.`, err);
        }
      }

      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (fileToUpload.size > maxSize) {
        toast.error(`File ${file.name} vượt quá dung lượng cho phép (${isVideo ? '50MB' : '10MB'}).`);
        return;
      }

      newItems.push({
        id,
        fileName: fileToUpload.name,
        progress: 0,
        status: 'pending',
        previewUrl: URL.createObjectURL(fileToUpload)
      });
      filesToUpload.push({ file: fileToUpload, id });
    });

    await Promise.all(processPromises);

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
    shouldCompressImages,
    setShouldCompressImages,
    isSaving: isCreatingMilestone || isUpdatingMilestone
  };
}
