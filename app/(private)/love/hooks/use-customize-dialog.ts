'use client';

import * as React from 'react';
import { useLoveMutation } from '@/hooks/use-love';
import { toast } from 'sonner';
import { LoveConnection } from '../constants';

export type LoveThemeType = 'rose' | 'primary' | 'ocean' | 'lavender' | 'sunset';

interface UseCustomizeDialogProps {
  loveConn: LoveConnection;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function useCustomizeDialog({
  loveConn,
  isOpen,
  setIsOpen,
}: UseCustomizeDialogProps) {
  const { updateLoveCustomize, uploadLoveAsset, isUpdatingCustomize } = useLoveMutation();

  const [myNicknameState, setMyNicknameState] = React.useState('');
  const [partnerNicknameState, setPartnerNicknameState] = React.useState('');
  const [myBirthdateState, setMyBirthdateState] = React.useState('');
  const [partnerBirthdateState, setPartnerBirthdateState] = React.useState('');
  
  const [openMyBirthdateCalendar, setOpenMyBirthdateCalendar] = React.useState(false);
  const [openPartnerBirthdateCalendar, setOpenPartnerBirthdateCalendar] = React.useState(false);

  const [myAvatarUrl, setMyAvatarUrl] = React.useState('');
  const [partnerAvatarUrlState, setPartnerAvatarUrlState] = React.useState('');
  const [backgroundUrlState, setBackgroundUrlState] = React.useState('');
  const [loveThemeState, setLoveThemeState] = React.useState<LoveThemeType>('rose');

  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [uploadTarget, setUploadTarget] = React.useState<'myAvatar' | 'partnerAvatar' | 'background' | null>(null);

  // State quản lý việc Cắt ảnh (Crop Image)
  const [cropperOpen, setCropperOpen] = React.useState(false);
  const [cropperFile, setCropperFile] = React.useState<File | null>(null);
  const [cropperType, setCropperType] = React.useState<'myAvatar' | 'partnerAvatar' | 'background' | null>(null);

  // Refs cho các input file
  const dialogMyAvatarInputRef = React.useRef<HTMLInputElement>(null);
  const dialogPartnerAvatarInputRef = React.useRef<HTMLInputElement>(null);
  const dialogBackgroundInputRef = React.useRef<HTMLInputElement>(null);

  // Đổ dữ liệu cũ khi Dialog mở ra
  React.useEffect(() => {
    if (!isOpen || !loveConn) return;

    const timer = setTimeout(() => {
      setMyAvatarUrl(loveConn.is_user_1 ? (loveConn.user_1_avatar_url || '') : (loveConn.user_2_avatar_url || ''));
      setPartnerAvatarUrlState(loveConn.is_user_1 ? (loveConn.user_2_avatar_url || '') : (loveConn.user_1_avatar_url || ''));
      setBackgroundUrlState(loveConn.background_url || '');
      setMyNicknameState(loveConn.is_user_1 ? (loveConn.user_1_nickname || '') : (loveConn.user_2_nickname || ''));
      setPartnerNicknameState(loveConn.is_user_1 ? (loveConn.user_2_nickname || '') : (loveConn.user_1_nickname || ''));
      setMyBirthdateState(loveConn.is_user_1 ? (loveConn.user_1_birthdate || '') : (loveConn.user_2_birthdate || ''));
      setPartnerBirthdateState(loveConn.is_user_1 ? (loveConn.user_2_birthdate || '') : (loveConn.user_1_birthdate || ''));
      setLoveThemeState((loveConn.theme as LoveThemeType) || 'rose');

      setUploadProgress(null);
      setUploadTarget(null);
      setCropperOpen(false);
      setCropperFile(null);
      setCropperType(null);
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, loveConn]);

  // Submit tùy chỉnh
  const handleCustomizeSubmit = async () => {
    if (!loveConn) return;
    try {
      const payload: {
        connectionId: string;
        user1AvatarUrl?: string | null;
        user2AvatarUrl?: string | null;
        backgroundUrl?: string | null;
        user1Nickname?: string | null;
        user2Nickname?: string | null;
        user1Birthdate?: string | null;
        user2Birthdate?: string | null;
        theme?: string;
      } = {
        connectionId: loveConn.connection_id,
        backgroundUrl: backgroundUrlState.trim() || null,
        theme: loveThemeState,
      };

      if (loveConn.is_user_1) {
        payload.user1AvatarUrl = myAvatarUrl.trim() || null;
        payload.user2AvatarUrl = partnerAvatarUrlState.trim() || null;
        payload.user1Nickname = myNicknameState.trim() || null;
        payload.user2Nickname = partnerNicknameState.trim() || null;
        payload.user1Birthdate = myBirthdateState || null;
        payload.user2Birthdate = partnerBirthdateState || null;
      } else {
        payload.user2AvatarUrl = myAvatarUrl.trim() || null;
        payload.user1AvatarUrl = partnerAvatarUrlState.trim() || null;
        payload.user2Nickname = myNicknameState.trim() || null;
        payload.user1Nickname = partnerNicknameState.trim() || null;
        payload.user2Birthdate = myBirthdateState || null;
        payload.user1Birthdate = partnerBirthdateState || null;
      }

      await updateLoveCustomize(payload);
      toast.success('Lưu cấu hình giao diện thành công!');
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Lưu cấu hình giao diện thất bại.');
    }
  };

  // Khôi phục mặc định
  const handleResetCustomize = async (resetType: 'myAvatar' | 'partnerAvatar' | 'background') => {
    if (!loveConn) return;
    try {
      const payload: {
        connectionId: string;
        user1AvatarUrl?: string | null;
        user2AvatarUrl?: string | null;
        backgroundUrl?: string | null;
      } = {
        connectionId: loveConn.connection_id,
      };

      if (resetType === 'background') {
        payload.backgroundUrl = null;
        setBackgroundUrlState('');
      } else if (resetType === 'myAvatar') {
        if (loveConn.is_user_1) {
          payload.user1AvatarUrl = null;
        } else {
          payload.user2AvatarUrl = null;
        }
        setMyAvatarUrl('');
      } else if (resetType === 'partnerAvatar') {
        if (loveConn.is_user_1) {
          payload.user2AvatarUrl = null;
        } else {
          payload.user1AvatarUrl = null;
        }
        setPartnerAvatarUrlState('');
      }

      await updateLoveCustomize(payload);
      toast.success('Đã khôi phục thiết lập mặc định!');
    } catch (err) {
      console.error(err);
      toast.error('Khôi phục thiết lập mặc định thất bại.');
    }
  };

  // Upload file sau khi crop
  const uploadCroppedFile = async (file: File, uploadType: 'myAvatar' | 'partnerAvatar' | 'background') => {
    if (!loveConn) return;

    let fakeProgressInterval: NodeJS.Timeout | null = null;

    try {
      setUploadTarget(uploadType);
      setUploadProgress(0);

      let type: "avatar1" | "avatar2" | "background";
      if (uploadType === 'background') {
        type = 'background';
      } else if (uploadType === 'myAvatar') {
        type = loveConn.is_user_1 ? 'avatar1' : 'avatar2';
      } else {
        type = loveConn.is_user_1 ? 'avatar2' : 'avatar1';
      }

      const res = await uploadLoveAsset({
        file,
        type,
        connectionId: loveConn.connection_id,
        onProgress: (percent) => {
          const scaledPercent = Math.round(percent * 0.85);
          setUploadProgress(scaledPercent);

          if (percent === 100 && !fakeProgressInterval) {
            let fakeProgress = 85;
            fakeProgressInterval = setInterval(() => {
              if (fakeProgress < 99) {
                fakeProgress += Math.random() > 0.5 ? 1 : 2;
                if (fakeProgress > 99) fakeProgress = 99;
                setUploadProgress(fakeProgress);
              }
            }, 300);
          }
        }
      });

      if (fakeProgressInterval) {
        clearInterval(fakeProgressInterval);
        fakeProgressInterval = null;
      }

      setUploadProgress(100);
      await new Promise((r) => setTimeout(r, 450));

      if (uploadType === 'background') {
        setBackgroundUrlState(res.url);
      } else if (uploadType === 'myAvatar') {
        setMyAvatarUrl(res.url);
      } else if (uploadType === 'partnerAvatar') {
        setPartnerAvatarUrlState(res.url);
      }
      toast.success('Tải ảnh lên thành công!');
    } catch (err) {
      if (fakeProgressInterval) {
        clearInterval(fakeProgressInterval);
      }
      console.error(err);
      toast.error('Tải ảnh lên thất bại.');
    } finally {
      setUploadProgress(null);
      setUploadTarget(null);
    }
  };

  // Upload file (chuyển sang Cropper)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, uploadType: 'myAvatar' | 'partnerAvatar' | 'background') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dung lượng ảnh tối đa là 5MB.');
      return;
    }

    e.target.value = '';

    setCropperFile(file);
    setCropperType(uploadType);
    setCropperOpen(true);
  };

  return {
    myNicknameState,
    setMyNicknameState,
    partnerNicknameState,
    setPartnerNicknameState,
    myBirthdateState,
    setMyBirthdateState,
    partnerBirthdateState,
    setPartnerBirthdateState,
    openMyBirthdateCalendar,
    setOpenMyBirthdateCalendar,
    openPartnerBirthdateCalendar,
    setOpenPartnerBirthdateCalendar,
    myAvatarUrl,
    setMyAvatarUrl,
    partnerAvatarUrlState,
    setPartnerAvatarUrlState,
    backgroundUrlState,
    setBackgroundUrlState,
    loveThemeState,
    setLoveThemeState,
    uploadProgress,
    uploadTarget,
    cropperOpen,
    setCropperOpen,
    cropperFile,
    setCropperFile,
    cropperType,
    dialogMyAvatarInputRef,
    dialogPartnerAvatarInputRef,
    dialogBackgroundInputRef,
    handleCustomizeSubmit,
    handleResetCustomize,
    handleFileUpload,
    uploadCroppedFile,
    isSaving: isUpdatingCustomize
  };
}
