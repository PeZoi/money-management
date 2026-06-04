'use client';

import * as React from 'react';
import { useLoveMutation } from '@/hooks/use-love';
import { toast } from 'sonner';
import { LoveConnection } from '../constants';
import { getZodiacSign, getLunarAnimal, getAge } from '@/lib/zodiac';

interface UserType {
  avatarUrl?: string | null;
  displayName?: string | null;
}

export function useHeartbeatCard(
  loveConn: LoveConnection,
  user: UserType | null | undefined
) {
  const { uploadLoveAsset, updateLoveCustomize } = useLoveMutation();

  // State cập nhật thời gian thực
  const [timePassed, setTimePassed] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // State quản lý việc Cắt ảnh (Crop Image) trước khi upload
  const [cropperOpen, setCropperOpen] = React.useState(false);
  const [cropperFile, setCropperFile] = React.useState<File | null>(null);
  const [cropperType, setCropperType] = React.useState<'myAvatar' | 'partnerAvatar' | null>(null);

  // State upload progress
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [uploadTarget, setUploadTarget] = React.useState<'myAvatar' | 'partnerAvatar' | null>(null);

  // Refs cho các input file ẩn
  const myAvatarInputRef = React.useRef<HTMLInputElement>(null);
  const partnerAvatarInputRef = React.useRef<HTMLInputElement>(null);

  // Tính thời gian yêu nhau (chạy mỗi giây)
  React.useEffect(() => {
    if (!loveConn.anniversary_date) return;

    const calculateTime = () => {
      const annivDate = new Date(loveConn.anniversary_date);
      annivDate.setHours(0, 0, 0, 0);

      const now = new Date();
      const diffMs = now.getTime() - annivDate.getTime();

      if (diffMs < 0) {
        setTimePassed({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimePassed({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [loveConn.anniversary_date]);

  // Thực hiện tải lên file sau khi đã qua bước cắt ảnh (Crop)
  const uploadCroppedFile = async (file: File, uploadType: 'myAvatar' | 'partnerAvatar') => {
    let fakeProgressInterval: NodeJS.Timeout | null = null;

    try {
      setUploadTarget(uploadType);
      setUploadProgress(0);

      const type = uploadType === 'myAvatar'
        ? (loveConn.is_user_1 ? 'avatar1' : 'avatar2')
        : (loveConn.is_user_1 ? 'avatar2' : 'avatar1');

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

      const payload: {
        connectionId: string;
        user1AvatarUrl?: string | null;
        user2AvatarUrl?: string | null;
      } = {
        connectionId: loveConn.connection_id,
      };

      if (uploadType === 'myAvatar') {
        if (loveConn.is_user_1) {
          payload.user1AvatarUrl = res.url;
        } else {
          payload.user2AvatarUrl = res.url;
        }
      } else {
        if (loveConn.is_user_1) {
          payload.user2AvatarUrl = res.url;
        } else {
          payload.user1AvatarUrl = res.url;
        }
      }

      await updateLoveCustomize(payload);
      toast.success('Cập nhật ảnh đại diện thành công!');
    } catch (err) {
      if (fakeProgressInterval) {
        clearInterval(fakeProgressInterval);
      }
      console.error(err);
      toast.error('Tải ảnh đại diện lên thất bại.');
    } finally {
      setUploadProgress(null);
      setUploadTarget(null);
    }
  };

  // Upload file hình ảnh (kích hoạt dialog cắt ảnh)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, uploadType: 'myAvatar' | 'partnerAvatar') => {
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

  // Tính toán thông tin hiển thị
  const myName = user?.displayName || 'Tôi';
  const partnerName = loveConn.partner_name || 'Người ấy';

  const myBirthdate = loveConn.is_user_1 ? loveConn.user_1_birthdate : loveConn.user_2_birthdate;
  const partnerBirthdate = loveConn.partner_birthdate;

  const myZodiac = getZodiacSign(myBirthdate);
  const myLunar = getLunarAnimal(myBirthdate);
  const myAge = getAge(myBirthdate);

  const partnerZodiac = getZodiacSign(partnerBirthdate);
  const partnerLunar = getLunarAnimal(partnerBirthdate);
  const partnerAge = getAge(partnerBirthdate);

  const myDisplayName = (loveConn.is_user_1 ? loveConn.user_1_nickname : loveConn.user_2_nickname) || myName;
  const partnerDisplayName = (loveConn.is_user_1 ? loveConn.user_2_nickname : loveConn.user_1_nickname) || partnerName;

  return {
    timePassed,
    cropperOpen,
    setCropperOpen,
    cropperFile,
    setCropperFile,
    cropperType,
    uploadProgress,
    uploadTarget,
    myAvatarInputRef,
    partnerAvatarInputRef,
    handleFileUpload,
    uploadCroppedFile,
    // Trả về thêm các biến tính toán
    myName,
    partnerName,
    myBirthdate,
    partnerBirthdate,
    myZodiac,
    myLunar,
    myAge,
    partnerZodiac,
    partnerLunar,
    partnerAge,
    myDisplayName,
    partnerDisplayName
  };
}
