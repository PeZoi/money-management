'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { 
  useMyLoveConnection, 
  useLoveMilestones, 
  useLoveMutation 
} from '@/hooks/use-love';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  Heart, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles,
  Camera, 
  Plane, 
  Gift, 
  Coffee, 
  Utensils, 
  MapPin,
  Clock,
  Palette,
  Upload,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import type { LoveMilestoneRow } from '@/types/database';
import { getZodiacSign, getLunarAnimal, getAge } from '@/lib/zodiac';
import EmojiPicker from 'emoji-picker-react';

// Bản đồ chuyển đổi các icon cũ lưu trong DB sang Emoji mới
const OLD_ICON_MAP: Record<string, string> = {
  'Heart': '❤️',
  'Camera': '📸',
  'Plane': '✈️',
  'Gift': '🎁',
  'Coffee': '☕',
  'Utensils': '🍜',
  'MapPin': '📍',
  'Sparkles': '✨'
};

// Danh sách các Emoji mặc định cho cột mốc
const MILESTONE_ICONS = [
  { name: '❤️', label: 'Tình yêu' },
  { name: '📸', label: 'Chụp ảnh' },
  { name: '✈️', label: 'Du lịch' },
  { name: '🎁', label: 'Quà tặng' },
  { name: '☕', label: 'Hẹn hò' },
  { name: '🍜', label: 'Ăn uống' },
  { name: '📍', label: 'Địa điểm' },
  { name: '✨', label: 'Đặc biệt' },
];

const THEMES = {
  rose: {
    name: 'Hồng Rose',
    primary: '#f43f5e',
    text: 'text-rose-600 dark:text-rose-400',
    textHover: 'hover:text-rose-500',
    textMuted: 'text-rose-800 dark:text-rose-200',
    bg: 'bg-rose-500 text-white',
    bgHover: 'hover:bg-rose-600',
    bgLight: 'bg-rose-50/70 dark:bg-rose-950/30',
    border: 'border-rose-100 dark:border-rose-900/30',
    borderTimeline: 'border-rose-200 dark:border-rose-900/50',
    pulseColor: 'text-rose-500 fill-rose-500 bg-rose-100 dark:bg-rose-950/60',
    pulseBorder: 'border-rose-200/50 dark:border-rose-900/50',
    timelineIconBg: 'bg-rose-50 dark:bg-rose-950/30',
    ringFocus: 'focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-500',
    ringFocusCalendar: 'focus:ring-2 focus:ring-rose-500/20',
    avatarBg: 'bg-rose-100 dark:bg-rose-950',
    avatarBorder: 'border-rose-400 hover:border-rose-500',
    borderHover: 'hover:border-rose-200/80 dark:hover:border-rose-900/60',
    textRoseColor: 'text-rose-500',
    fillColor: 'fill-rose-500',
    progressStroke: 'stroke-rose-500',
    progressBg: 'stroke-rose-100 dark:stroke-rose-950/20',
    dayGradient: 'from-rose-500 via-pink-500 to-rose-600',
    cardBg: 'from-rose-500/10 via-rose-500/5 to-background border-rose-200/50 dark:border-rose-900/30',
    pulseLine: 'from-rose-400 via-rose-300 to-rose-400',
    textOnBg: 'text-rose-400',
    pulseColorOnBg: 'text-rose-400 fill-rose-400 bg-white/10 border-white/20',
    pulseLineOnBg: 'from-rose-400/40 via-rose-400/10 to-rose-400/40',
  },
  primary: {
    name: 'Xanh Lá Primary',
    primary: '#16a34a',
    text: 'text-primary',
    textHover: 'hover:text-primary',
    textMuted: 'text-primary/80 dark:text-primary/70',
    bg: 'bg-primary text-primary-foreground font-semibold',
    bgHover: 'hover:bg-primary/95',
    bgLight: 'bg-primary/10 dark:bg-primary/5',
    border: 'border-primary/20',
    borderTimeline: 'border-primary/30',
    pulseColor: 'text-primary fill-primary bg-primary/10 dark:bg-primary/20',
    pulseBorder: 'border-primary/25',
    timelineIconBg: 'bg-primary/10 dark:bg-primary/5',
    ringFocus: 'focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary',
    ringFocusCalendar: 'focus:ring-2 focus:ring-primary/20',
    avatarBg: 'bg-primary/20 dark:bg-primary/30',
    avatarBorder: 'border-primary/60 hover:border-primary',
    borderHover: 'hover:border-primary/50',
    textRoseColor: 'text-primary',
    fillColor: 'fill-primary',
    progressStroke: 'stroke-primary',
    progressBg: 'stroke-primary/10 dark:stroke-primary/5',
    dayGradient: 'from-emerald-500 to-green-600',
    cardBg: 'from-primary/10 via-primary/5 to-background border-primary/20',
    pulseLine: 'from-primary/70 via-primary/40 to-primary/70',
    textOnBg: 'text-emerald-400 dark:text-emerald-400',
    pulseColorOnBg: 'text-emerald-400 fill-emerald-400 bg-white/10 border-white/20',
    pulseLineOnBg: 'from-emerald-400/40 via-emerald-400/10 to-emerald-400/40',
  },
  ocean: {
    name: 'Xanh Dương Ocean',
    primary: '#0ea5e9',
    text: 'text-sky-600 dark:text-sky-400',
    textHover: 'hover:text-sky-500',
    textMuted: 'text-sky-800 dark:text-sky-200',
    bg: 'bg-sky-500 text-white',
    bgHover: 'hover:bg-sky-600',
    bgLight: 'bg-sky-50/70 dark:bg-sky-950/30',
    border: 'border-sky-100 dark:border-sky-900/30',
    borderTimeline: 'border-sky-200 dark:border-sky-900/50',
    pulseColor: 'text-sky-500 fill-sky-500 bg-sky-100 dark:bg-sky-950/60',
    pulseBorder: 'border-sky-200/50 dark:border-sky-900/50',
    timelineIconBg: 'bg-sky-50 dark:bg-sky-950/30',
    ringFocus: 'focus-visible:ring-2 focus-visible:ring-sky-500/20 focus-visible:border-sky-500',
    ringFocusCalendar: 'focus:ring-2 focus:ring-sky-500/20',
    avatarBg: 'bg-sky-100 dark:bg-sky-950',
    avatarBorder: 'border-sky-400 hover:border-sky-500',
    borderHover: 'hover:border-sky-200/80 dark:hover:border-sky-900/60',
    textRoseColor: 'text-sky-500',
    fillColor: 'fill-sky-500',
    progressStroke: 'stroke-sky-500',
    progressBg: 'stroke-sky-100 dark:stroke-sky-950/20',
    dayGradient: 'from-sky-500 via-blue-500 to-indigo-500',
    cardBg: 'from-sky-500/10 via-sky-500/5 to-background border-sky-200/50 dark:border-sky-900/30',
    pulseLine: 'from-sky-400 via-sky-300 to-sky-400',
    textOnBg: 'text-sky-400',
    pulseColorOnBg: 'text-sky-400 fill-sky-400 bg-white/10 border-white/20',
    pulseLineOnBg: 'from-sky-400/40 via-sky-400/10 to-sky-400/40',
  },
  lavender: {
    name: 'Tím Lavender',
    primary: '#a855f7',
    text: 'text-purple-600 dark:text-purple-400',
    textHover: 'hover:text-purple-500',
    textMuted: 'text-purple-800 dark:text-purple-200',
    bg: 'bg-purple-500 text-white',
    bgHover: 'hover:bg-purple-600',
    bgLight: 'bg-purple-50/70 dark:bg-purple-950/30',
    border: 'border-purple-100 dark:border-purple-900/30',
    borderTimeline: 'border-purple-200 dark:border-purple-900/50',
    pulseColor: 'text-purple-500 fill-purple-500 bg-purple-100 dark:bg-purple-950/60',
    pulseBorder: 'border-purple-200/50 dark:border-purple-900/50',
    timelineIconBg: 'bg-purple-50 dark:bg-purple-950/30',
    ringFocus: 'focus-visible:ring-2 focus-visible:ring-purple-500/20 focus-visible:border-purple-500',
    ringFocusCalendar: 'focus:ring-2 focus:ring-purple-500/20',
    avatarBg: 'bg-purple-100 dark:bg-purple-950',
    avatarBorder: 'border-purple-400 hover:border-purple-500',
    borderHover: 'hover:border-purple-200/80 dark:hover:border-purple-900/60',
    textRoseColor: 'text-purple-500',
    fillColor: 'fill-purple-500',
    progressStroke: 'stroke-purple-500',
    progressBg: 'stroke-purple-100 dark:stroke-purple-950/20',
    dayGradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
    cardBg: 'from-purple-500/10 via-purple-500/5 to-background border-purple-200/50 dark:border-purple-900/30',
    pulseLine: 'from-purple-400 via-purple-300 to-purple-400',
    textOnBg: 'text-purple-400',
    pulseColorOnBg: 'text-purple-400 fill-purple-400 bg-white/10 border-white/20',
    pulseLineOnBg: 'from-purple-400/40 via-purple-400/10 to-purple-400/40',
  },
  sunset: {
    name: 'Cam Sunset',
    primary: '#f97316',
    text: 'text-orange-600 dark:text-orange-400',
    textHover: 'hover:text-orange-500',
    textMuted: 'text-orange-800 dark:text-orange-200',
    bg: 'bg-orange-500 text-white',
    bgHover: 'hover:bg-orange-600',
    bgLight: 'bg-orange-50/70 dark:bg-orange-950/30',
    border: 'border-orange-100 dark:border-orange-900/30',
    borderTimeline: 'border-orange-200 dark:border-orange-900/50',
    pulseColor: 'text-orange-500 fill-orange-500 bg-orange-100 dark:bg-orange-950/60',
    pulseBorder: 'border-orange-200/50 dark:border-orange-900/50',
    timelineIconBg: 'bg-orange-50 dark:bg-orange-950/30',
    ringFocus: 'focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500',
    ringFocusCalendar: 'focus:ring-2 focus:ring-orange-500/20',
    avatarBg: 'bg-orange-100 dark:bg-orange-950',
    avatarBorder: 'border-orange-400 hover:border-orange-500',
    borderHover: 'hover:border-orange-200/80 dark:hover:border-rose-900/60',
    textRoseColor: 'text-orange-500',
    fillColor: 'fill-orange-500',
    progressStroke: 'stroke-orange-500',
    progressBg: 'stroke-orange-100 dark:stroke-orange-950/20',
    dayGradient: 'from-orange-500 via-amber-500 to-yellow-500',
    cardBg: 'from-orange-500/10 via-orange-500/5 to-background border-orange-200/50 dark:border-orange-900/30',
    pulseLine: 'from-orange-400 via-orange-300 to-orange-400',
    textOnBg: 'text-orange-400',
    pulseColorOnBg: 'text-orange-400 fill-orange-400 bg-white/10 border-white/20',
    pulseLineOnBg: 'from-orange-400/40 via-orange-400/10 to-orange-400/40',
  }
};

export default function LovePage() {
  const { user } = useAuth();
  const { data: loveConn, isLoading: isConnLoading } = useMyLoveConnection();
  const { data: milestones = [], isLoading: isMilestonesLoading } = useLoveMilestones(
    loveConn?.connection_id
  );
  
  const { 
    updateAnniversary, 
    createMilestone, 
    updateMilestone, 
    deleteMilestone,
    updateLoveCustomize,
    uploadLoveAsset,
    isUpdatingAnniversary,
    isCreatingMilestone,
    isUpdatingMilestone,
    isDeletingMilestone,
    isUpdatingCustomize,
    isUploadingAsset
  } = useLoveMutation();

  // State cập nhật thời gian thực
  const [timePassed, setTimePassed] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // State Dialog sửa ngày kỷ niệm
  const [isEditAnniversaryOpen, setIsEditAnniversaryOpen] = React.useState(false);
  const [newAnniversaryDate, setNewAnniversaryDate] = React.useState<Date | undefined>(undefined);
  const [openAnnivCalendar, setOpenAnnivCalendar] = React.useState(false);

  // State Dialog Cột mốc (Thêm/Sửa)
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = React.useState(false);
  const [editingMilestone, setEditingMilestone] = React.useState<LoveMilestoneRow | null>(null);
  const [milestoneTitle, setMilestoneTitle] = React.useState('');
  const [milestoneDesc, setMilestoneDesc] = React.useState('');
  const [milestoneDate, setMilestoneDate] = React.useState<Date | undefined>(new Date());
  const [milestoneIcon, setMilestoneIcon] = React.useState('Heart');
  const [openMilestoneCalendar, setOpenMilestoneCalendar] = React.useState(false);

  // State Dialog Tùy chỉnh giao diện
  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = React.useState(false);
  const [myAvatarUrl, setMyAvatarUrl] = React.useState('');
  const [partnerAvatarUrlState, setPartnerAvatarUrlState] = React.useState('');
  const [backgroundUrlState, setBackgroundUrlState] = React.useState('');
  const [myNicknameState, setMyNicknameState] = React.useState('');
  const [partnerNicknameState, setPartnerNicknameState] = React.useState('');
  const [myBirthdateState, setMyBirthdateState] = React.useState('');
  const [partnerBirthdateState, setPartnerBirthdateState] = React.useState('');
  const [openMyBirthdateCalendar, setOpenMyBirthdateCalendar] = React.useState(false);
  const [openPartnerBirthdateCalendar, setOpenPartnerBirthdateCalendar] = React.useState(false);
  const [milestoneImageUrls, setMilestoneImageUrls] = React.useState<string[]>([]);
  const [tempImageUrl, setTempImageUrl] = React.useState('');
  const loveTheme = (loveConn?.theme as 'rose' | 'primary' | 'ocean' | 'lavender' | 'sunset') || 'rose';
  const [loveThemeState, setLoveThemeState] = React.useState<'rose' | 'primary' | 'ocean' | 'lavender' | 'sunset'>('rose');
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [uploadTarget, setUploadTarget] = React.useState<'myAvatar' | 'partnerAvatar' | 'background' | 'milestone' | null>(null);

  // States cho Lightbox Preview ảnh
  const [activePreviewUrls, setActivePreviewUrls] = React.useState<string[] | null>(null);
  const [activePreviewIdx, setActivePreviewIdx] = React.useState<number>(0);
  const [zoomActive, setZoomActive] = React.useState(false);
  const [touchStart, setTouchStart] = React.useState<{ x: number; y: number } | null>(null);
  const [touchDelta, setTouchDelta] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = React.useState(false);
  const [swipeDir, setSwipeDir] = React.useState<'horizontal' | 'vertical' | null>(null);
  const lastTapRef = React.useRef<number>(0);

  // Refs cho các input file ẩn
  const myAvatarInputRef = React.useRef<HTMLInputElement>(null);
  const partnerAvatarInputRef = React.useRef<HTMLInputElement>(null);
  const dialogMyAvatarInputRef = React.useRef<HTMLInputElement>(null);
  const dialogPartnerAvatarInputRef = React.useRef<HTMLInputElement>(null);
  const dialogBackgroundInputRef = React.useRef<HTMLInputElement>(null);
  const dialogMilestoneImageInputRef = React.useRef<HTMLInputElement>(null);

  // Mở Dialog tùy chỉnh
  const handleOpenCustomize = () => {
    if (loveConn) {
      setMyAvatarUrl(loveConn.is_user_1 ? (loveConn.user_1_avatar_url || '') : (loveConn.user_2_avatar_url || ''));
      setPartnerAvatarUrlState(loveConn.is_user_1 ? (loveConn.user_2_avatar_url || '') : (loveConn.user_1_avatar_url || ''));
      setBackgroundUrlState(loveConn.background_url || '');
      setMyNicknameState(loveConn.is_user_1 ? (loveConn.user_1_nickname || '') : (loveConn.user_2_nickname || ''));
      setPartnerNicknameState(loveConn.is_user_1 ? (loveConn.user_2_nickname || '') : (loveConn.user_1_nickname || ''));
      setMyBirthdateState(loveConn.is_user_1 ? (loveConn.user_1_birthdate || '') : (loveConn.user_2_birthdate || ''));
      setPartnerBirthdateState(loveConn.is_user_1 ? (loveConn.user_2_birthdate || '') : (loveConn.user_1_birthdate || ''));
      
      setLoveThemeState((loveConn.theme as any) || 'rose');
      
      setIsCustomizeDialogOpen(true);
    }
  };

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
      
      setIsCustomizeDialogOpen(false);
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    }
  };

  // Upload file hình ảnh
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, uploadType: 'myAvatar' | 'partnerAvatar' | 'background' | 'milestone') => {
    const file = e.target.files?.[0];
    if (!file || !loveConn) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dung lượng ảnh tối đa là 5MB.');
      return;
    }

    let fakeProgressInterval: NodeJS.Timeout | null = null;

    try {
      setUploadTarget(uploadType);
      setUploadProgress(0);

      let type: "avatar1" | "avatar2" | "background" | "milestone";
      if (uploadType === 'background') {
        type = 'background';
      } else if (uploadType === 'myAvatar') {
        type = loveConn.is_user_1 ? 'avatar1' : 'avatar2';
      } else if (uploadType === 'partnerAvatar') {
        type = loveConn.is_user_1 ? 'avatar2' : 'avatar1';
      } else {
        type = 'milestone';
      }

      const res = await uploadLoveAsset({
        file,
        type,
        connectionId: loveConn.connection_id,
        onProgress: (percent) => {
          // Gửi file từ client lên Next.js API server chiếm 85% tiến trình hiển thị
          const scaledPercent = Math.round(percent * 0.85);
          setUploadProgress(scaledPercent);

          // Khi client gửi xong file lên Next.js server (percent === 100)
          // Bắt đầu chạy tiến trình ảo (fake progress) tăng chậm lên 99% trong khi đợi Cloudinary phản hồi
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

      // Đạt 100% khi có kết quả trả về thành công từ Cloudinary
      setUploadProgress(100);
      
      // Delay nhẹ 400ms để hiệu ứng vòng tròn SVG đạt 100% trọn vẹn và đẹp mắt trước khi đóng popup
      await new Promise((r) => setTimeout(r, 450));
      
      if (uploadType === 'background') {
        setBackgroundUrlState(res.url);
      } else if (uploadType === 'myAvatar') {
        setMyAvatarUrl(res.url);
      } else if (uploadType === 'partnerAvatar') {
        setPartnerAvatarUrlState(res.url);
      } else if (uploadType === 'milestone') {
        setMilestoneImageUrls(prev => [...prev, res.url]);
      }
    } catch (err) {
      if (fakeProgressInterval) {
        clearInterval(fakeProgressInterval);
      }
      console.error(err);
    } finally {
      setUploadProgress(null);
      setUploadTarget(null);
    }
  };

  // Upload nhiều file hình ảnh cho cột mốc kỷ niệm
  const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !loveConn) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} không phải là ảnh.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} vượt quá dung lượng 5MB.`);
        continue;
      }

      let fakeProgressInterval: NodeJS.Timeout | null = null;
      try {
        setUploadTarget('milestone');
        setUploadProgress(0);

        const res = await uploadLoveAsset({
          file,
          type: 'milestone',
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
        
        setMilestoneImageUrls(prev => [...prev, res.url]);
      } catch (err) {
        if (fakeProgressInterval) {
          clearInterval(fakeProgressInterval);
        }
        console.error(err);
      } finally {
        setUploadProgress(null);
        setUploadTarget(null);
      }
    }
    e.target.value = '';
  };

  // Keyboard navigation cho Lightbox
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activePreviewUrls) return;
      if (e.key === 'Escape') {
        setActivePreviewUrls(null);
      } else if (e.key === 'ArrowRight') {
        if (activePreviewIdx < activePreviewUrls.length - 1) {
          setActivePreviewIdx(prev => prev + 1);
          setZoomActive(false);
        }
      } else if (e.key === 'ArrowLeft') {
        if (activePreviewIdx > 0) {
          setActivePreviewIdx(prev => prev - 1);
          setZoomActive(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePreviewUrls, activePreviewIdx]);

  // Touch Gestures cho Lightbox
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomActive) return;
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchDelta({ x: 0, y: 0 });
    setIsSwiping(true);
    setSwipeDir(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !isSwiping) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    let currentDir = swipeDir;
    if (!currentDir) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        currentDir = 'horizontal';
      } else {
        currentDir = 'vertical';
      }
      setSwipeDir(currentDir);
    }

    setTouchDelta({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !isSwiping || !activePreviewUrls) return;
    setIsSwiping(false);

    const threshold = 60; // Khoảng cách vuốt tối thiểu

    if (swipeDir === 'horizontal') {
      if (touchDelta.x < -threshold) {
        if (activePreviewIdx < activePreviewUrls.length - 1) {
          setActivePreviewIdx(prev => prev + 1);
          setZoomActive(false);
        }
      } else if (touchDelta.x > threshold) {
        if (activePreviewIdx > 0) {
          setActivePreviewIdx(prev => prev - 1);
          setZoomActive(false);
        }
      }
    } else if (swipeDir === 'vertical') {
      if (Math.abs(touchDelta.y) > threshold) {
        setActivePreviewUrls(null);
      }
    }

    setTouchStart(null);
    setTouchDelta({ x: 0, y: 0 });
    setSwipeDir(null);
  };

  const getTransformStyle = () => {
    if (!isSwiping) return undefined;
    if (swipeDir === 'horizontal') {
      return { transform: `translateX(${touchDelta.x}px)`, transition: 'none' };
    }
    if (swipeDir === 'vertical') {
      return { transform: `translateY(${touchDelta.y}px)`, opacity: Math.max(0.3, 1 - Math.abs(touchDelta.y) / 300), transition: 'none' };
    }
    return undefined;
  };

  const handleImageClick = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      setZoomActive(prev => !prev);
    }
    lastTapRef.current = now;
  };

  // Cấu hình theme đã được đồng bộ trực tiếp từ database qua biến computed loveTheme

  // Tính thời gian yêu nhau (chạy mỗi giây)
  React.useEffect(() => {
    if (!loveConn?.anniversary_date) return;

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
  }, [loveConn?.anniversary_date]);

  // Mở Dialog thêm cột mốc
  const handleOpenAddMilestone = () => {
    setEditingMilestone(null);
    setMilestoneTitle('');
    setMilestoneDesc('');
    setMilestoneDate(new Date());
    setMilestoneIcon('❤️');
    setMilestoneImageUrls([]);
    setTempImageUrl('');
    setOpenMilestoneCalendar(false);
    setIsMilestoneDialogOpen(true);
  };

  // Mở Dialog sửa cột mốc
  const handleOpenEditMilestone = (m: LoveMilestoneRow) => {
    setEditingMilestone(m);
    setMilestoneTitle(m.title);
    setMilestoneDesc(m.description || '');
    setMilestoneDate(new Date(m.milestone_date));
    setMilestoneIcon(m.icon || '❤️');
    
    let urls: string[] = [];
    if (m.image_url) {
      if (m.image_url.startsWith('[') && m.image_url.endsWith(']')) {
        try {
          urls = JSON.parse(m.image_url);
        } catch (e) {
          urls = [m.image_url];
        }
      } else {
        urls = [m.image_url];
      }
    }
    setMilestoneImageUrls(urls);
    setTempImageUrl('');
    
    setOpenMilestoneCalendar(false);
    setIsMilestoneDialogOpen(true);
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
      } else {
        await createMilestone({
          connectionId: loveConn.connection_id,
          title: milestoneTitle,
          description: milestoneDesc,
          milestoneDate: format(milestoneDate, 'yyyy-MM-dd'),
          icon: milestoneIcon,
          imageUrl: imageUrlPayload,
        });
      }
      setIsMilestoneDialogOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Xóa cột mốc
  const handleDeleteMilestone = async (id: string) => {
    if (!loveConn) return;
    if (confirm('Bạn có chắc chắn muốn xóa mốc kỷ niệm này?')) {
      try {
        await deleteMilestone({ id, connectionId: loveConn.connection_id });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Submit sửa ngày kỷ niệm
  const handleAnniversarySubmit = async () => {
    if (!loveConn || !newAnniversaryDate) return;

    try {
      await updateAnniversary({
        connectionId: loveConn.connection_id,
        anniversaryDate: format(newAnniversaryDate, 'yyyy-MM-dd'),
      });
      setIsEditAnniversaryOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditAnniversary = () => {
    if (loveConn) {
      setNewAnniversaryDate(new Date(loveConn.anniversary_date));
      setOpenAnnivCalendar(false);
      setIsEditAnniversaryOpen(true);
    }
  };

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

  // Tiêu đề viết hoa chữ cái đầu của tên
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

  // Định nghĩa màu sắc theo theme cấu hình
  const theme = THEMES[loveTheme] || THEMES.rose;

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
      {/* ─── HEARTBEAT CARD ─── */}
      <div 
        className={cn(
          "relative overflow-hidden rounded-3xl p-6 md:p-10 shadow-lg text-center border transition-all duration-500",
          loveConn.background_url 
            ? "border-white/10 text-white bg-cover bg-center" 
            : `bg-gradient-to-br ${theme.cardBg} text-foreground`
        )}
        style={loveConn.background_url ? { backgroundImage: `url(${loveConn.background_url})` } : undefined}
      >
        {/* Overlay làm mờ/tối khi có background tùy chỉnh */}
        {loveConn.background_url && (
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] z-0" />
        )}

        {/* Nút tùy chỉnh giao diện */}
        <div className="absolute top-4 right-4 z-20">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenCustomize}
            className={cn(
              "size-9 rounded-full shadow-sm cursor-pointer border backdrop-blur-sm transition-all",
              loveConn.background_url 
                ? `bg-black/35 hover:bg-black/60 text-white hover:${theme.textOnBg} border-white/15` 
                : `bg-white/80 hover:bg-muted text-muted-foreground hover:text-foreground dark:bg-zinc-900/80 ${theme.border}`
            )}
            title="Tùy chỉnh giao diện"
          >
            <Palette className="size-4" />
          </Button>
        </div>
        
        {/* Bong bóng trái tim bay ngầm */}
        <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
          <div className={cn("absolute top-10 left-10 animate-pulse", loveConn.background_url ? "text-white/30" : theme.textRoseColor)}><Heart className="size-6 fill-current" /></div>
          <div className={cn("absolute bottom-10 right-10 animate-pulse delay-500", loveConn.background_url ? "text-white/30" : theme.textRoseColor)}><Heart className="size-8 fill-current" /></div>
          <div className={cn("absolute top-1/2 left-3/4 animate-pulse delay-1000", loveConn.background_url ? "text-white/30" : theme.textRoseColor)}><Heart className="size-5 fill-current" /></div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Avatar đôi kết nối */}
          <div className="flex items-center justify-center gap-4 md:gap-12 w-full max-w-md">
            {/* User 1 (Tôi) */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div 
                onClick={() => {
                  if (uploadProgress === null) myAvatarInputRef.current?.click();
                }}
                className={cn(
                  "relative p-1.5 rounded-full border-2 group/avatar shadow-md transition-all",
                  loveConn.background_url
                    ? `bg-white/10 ${theme.avatarBorder}`
                    : `${theme.avatarBg} ${theme.avatarBorder}`,
                  uploadProgress === null ? "cursor-pointer" : "cursor-not-allowed"
                )}
                title="Click để đổi nhanh ảnh của bạn"
              >
                <Avatar 
                  src={loveConn.is_user_1 ? (loveConn.user_1_avatar_url || user?.avatarUrl) : (loveConn.user_2_avatar_url || user?.avatarUrl)} 
                  name={myName} 
                  className="size-16 md:size-24 border bg-background" 
                  width={96} 
                  height={96} 
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                  <Camera className="size-5 md:size-6 text-white" />
                </div>
              </div>
              <span className={cn(
                "font-black text-base md:text-xl max-w-[120px] md:max-w-[180px] truncate block tracking-wide",
                loveConn.background_url 
                  ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
                  : theme.text
              )}>
                {myDisplayName}
              </span>
              <div className={cn(
                "flex flex-col items-center gap-1.5 mt-2 px-3 py-2 rounded-2xl border text-xs leading-normal select-none transition-all w-full max-w-[140px] md:max-w-[180px]",
                loveConn.background_url
                  ? "bg-black/60 border-white/15 text-white backdrop-blur-sm shadow-md"
                  : `${theme.bgLight} ${theme.border} ${theme.textMuted} shadow-sm`
              )}>
                {myBirthdate ? (
                  <>
                    <span className="flex items-center gap-1 font-extrabold text-xs">
                      🎂 {format(new Date(myBirthdate), 'dd/MM/yyyy')}
                    </span>
                    <span className="flex items-center justify-center gap-1 flex-wrap text-[10px] md:text-xs font-semibold text-center">
                      <span>{myZodiac?.emoji} {myZodiac?.name}</span>
                      <span className="opacity-50">•</span>
                      <span>{myLunar?.emoji} {myLunar?.name} ({myAge} tuổi)</span>
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] italic opacity-85">Chưa đặt ngày sinh</span>
                )}
              </div>
              <input 
                type="file"
                ref={myAvatarInputRef}
                className="hidden"
                accept="image/*"
                disabled={uploadProgress !== null}
                onChange={(e) => handleFileUpload(e, 'myAvatar')}
              />
            </div>

            {/* Heart beat center connection */}
            <div className="relative flex flex-col items-center justify-center z-10">
              {/* Vệt sáng pulsing gradient line connecting avatar */}
              <div className={cn(
                "absolute h-0.5 w-16 md:w-32 -z-10 animate-pulse bg-gradient-to-r",
                loveConn.background_url
                  ? theme.pulseLineOnBg
                  : theme.pulseLine
              )} />
              
              <div className={cn(
                "p-4 rounded-full shadow-inner animate-bounce border transition-all",
                loveConn.background_url
                  ? theme.pulseColorOnBg
                  : `${theme.pulseColor} ${theme.pulseBorder}`
              )}>
                <Heart className="size-8 md:size-10 animate-pulse cursor-pointer fill-current" />
              </div>
            </div>

            {/* User 2 (Partner) */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div 
                onClick={() => {
                  if (uploadProgress === null) partnerAvatarInputRef.current?.click();
                }}
                className={cn(
                  "relative p-1.5 rounded-full border-2 group/avatar shadow-md transition-all",
                  loveConn.background_url
                    ? `bg-white/10 ${theme.avatarBorder}`
                    : `${theme.avatarBg} ${theme.avatarBorder}`,
                  uploadProgress === null ? "cursor-pointer" : "cursor-not-allowed"
                )}
                title="Click để đổi nhanh ảnh của người ấy"
              >
                <Avatar 
                  src={loveConn.partner_avatar_url} 
                  name={partnerName} 
                  className="size-16 md:size-24 border bg-background" 
                  width={96} 
                  height={96} 
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                  <Camera className="size-5 md:size-6 text-white" />
                </div>
              </div>
              <span className={cn(
                "font-black text-base md:text-xl max-w-[120px] md:max-w-[180px] truncate block tracking-wide",
                loveConn.background_url 
                  ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
                  : theme.text
              )}>
                {partnerDisplayName}
              </span>
              <div className={cn(
                "flex flex-col items-center gap-1.5 mt-2 px-3 py-2 rounded-2xl border text-xs leading-normal select-none transition-all w-full max-w-[140px] md:max-w-[180px]",
                loveConn.background_url
                  ? "bg-black/60 border-white/15 text-white backdrop-blur-sm shadow-md"
                  : `${theme.bgLight} ${theme.border} ${theme.textMuted} shadow-sm`
              )}>
                {partnerBirthdate ? (
                  <>
                    <span className="flex items-center gap-1 font-extrabold text-xs">
                      🎂 {format(new Date(partnerBirthdate), 'dd/MM/yyyy')}
                    </span>
                    <span className="flex items-center justify-center gap-1 flex-wrap text-[10px] md:text-xs font-semibold text-center">
                      <span>{partnerZodiac?.emoji} {partnerZodiac?.name}</span>
                      <span className="opacity-50">•</span>
                      <span>{partnerLunar?.emoji} {partnerLunar?.name} ({partnerAge} tuổi)</span>
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] italic opacity-85">Chưa đặt ngày sinh</span>
                )}
              </div>
              <input 
                type="file"
                ref={partnerAvatarInputRef}
                className="hidden"
                accept="image/*"
                disabled={uploadProgress !== null}
                onChange={(e) => handleFileUpload(e, 'partnerAvatar')}
              />
            </div>
          </div>

          {/* Clock counter */}
          <div className="space-y-3 mt-4">
            <span className={cn(
              "text-xs font-semibold tracking-widest uppercase px-3.5 py-1.5 rounded-full border",
              loveConn.background_url 
                ? "text-white/80 bg-white/10 border-white/10" 
                : `${theme.text} ${theme.bgLight} ${theme.border}`
            )}>
              Ngày yêu nhau
            </span>

            {/* Khối đếm số ngày */}
            <div>
              <h1 className={cn(
                "text-4xl md:text-6xl font-black tracking-tight select-none",
                loveConn.background_url 
                  ? `bg-gradient-to-r ${theme.dayGradient} bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]` 
                  : `bg-gradient-to-r ${theme.dayGradient} bg-clip-text text-transparent`
              )}>
                {timePassed.days.toLocaleString('vi-VN')} <span className={cn("text-xl md:text-3xl font-bold", loveConn.background_url ? "text-white" : "text-foreground")}>ngày</span>
              </h1>
            </div>

            {/* Đếm chi tiết giờ phút giây */}
            <div className={cn(
              "flex justify-center items-center gap-2.5 text-xs md:text-sm font-bold p-2 md:p-2.5 rounded-xl border max-w-sm mx-auto shadow-inner select-none whitespace-nowrap",
              loveConn.background_url 
                ? "text-slate-200 bg-black/45 border-white/10 backdrop-blur-[1px]" 
                : "text-muted-foreground bg-background/50 dark:bg-background/20 border"
            )}>
              <Clock className={cn("size-4 shrink-0", loveConn.background_url ? theme.textOnBg : theme.textRoseColor)} />
              <div className="flex items-center gap-0.5">
                <span className="tabular-nums min-w-[18px] text-center">{timePassed.hours.toString().padStart(2, '0')}</span>
                <span>giờ</span>
              </div>
              <span className="text-muted-foreground/30 dark:text-muted-foreground/20">:</span>
              <div className="flex items-center gap-0.5">
                <span className="tabular-nums min-w-[18px] text-center">{timePassed.minutes.toString().padStart(2, '0')}</span>
                <span>phút</span>
              </div>
              <span className="text-muted-foreground/30 dark:text-muted-foreground/20">:</span>
              <div className={cn("flex items-center gap-0.5", loveConn.background_url ? theme.textOnBg : theme.textRoseColor)}>
                <span className="tabular-nums min-w-[18px] text-center font-extrabold">{timePassed.seconds.toString().padStart(2, '0')}</span>
                <span>giây</span>
              </div>
            </div>

            {/* Ngày kỷ niệm */}
            <div className={cn(
              "flex justify-center items-center gap-2 text-xs md:text-sm pt-2",
              loveConn.background_url ? "text-slate-300" : "text-muted-foreground"
            )}>
              <CalendarIcon className="size-4" />
              <span>Bắt đầu từ: <strong className={loveConn.background_url ? "text-white" : "text-foreground"}>{new Date(loveConn.anniversary_date).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}</strong></span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleOpenEditAnniversary}
                className={cn(
                  "size-7 rounded-full cursor-pointer ml-1",
                  loveConn.background_url 
                    ? `hover:bg-white/10 text-white/70 hover:${theme.textOnBg}` 
                    : `hover:bg-muted text-muted-foreground hover:${theme.text}`
                )}
                title="Thay đổi ngày kỷ niệm"
              >
                <Edit3 className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── LOVE TIMELINE ─── */}
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
          <div className={cn("relative border-l ml-4 md:ml-6 pl-6 md:pl-8 space-y-6 py-2 select-none", theme.borderTimeline)}>
            {milestones.map((m) => {
              const displayIcon = OLD_ICON_MAP[m.icon] || m.icon || '❤️';

              return (
                <div key={m.id} className="relative group">
                  {/* Timeline point icon wrapper */}
                  <div className={cn("absolute -left-[43px] md:-left-[51px] top-1.5 rounded-full border shadow-sm flex items-center justify-center size-8 md:size-10 select-none text-base md:text-lg bg-white dark:bg-zinc-900", theme.border, theme.timelineIconBg)}>
                    <span className="leading-none">{displayIcon}</span>
                  </div>

                  {/* Card content */}
                  <div className={cn("bg-card border transition-all rounded-2xl p-5 shadow-sm space-y-2 group-hover:translate-x-1 duration-300", theme.borderHover)}>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        {/* Milestone date */}
                        <span className={cn("text-[11px] font-bold tracking-wider block mb-0.5", theme.text)}>
                          {new Date(m.milestone_date).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                        {/* Title */}
                        <h3 className="text-base font-bold text-foreground">{m.title}</h3>
                      </div>

                      {/* Action buttons (only show on hover/focus) */}
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
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {m.description}
                      </p>
                    )}

                    {/* Image */}
                    {(() => {
                      let urls: string[] = [];
                      if (m.image_url) {
                        if (m.image_url.startsWith('[') && m.image_url.endsWith(']')) {
                          try {
                            urls = JSON.parse(m.image_url);
                          } catch (e) {
                            urls = [m.image_url];
                          }
                        } else {
                          urls = [m.image_url];
                        }
                      }
                      if (urls.length === 0) return null;

                      const handlePreview = (idx: number) => {
                        setActivePreviewUrls(urls);
                        setActivePreviewIdx(idx);
                        setZoomActive(false);
                      };

                      // 1 ảnh
                      if (urls.length === 1) {
                        return (
                          <div className="mt-3 max-w-sm rounded-2xl overflow-hidden border shadow-xs hover:shadow-md transition-shadow group/img-item">
                            <div className="relative aspect-[4/3] sm:aspect-video overflow-hidden">
                              <img 
                                src={urls[0]} 
                                alt={m.title} 
                                className="size-full object-cover group-hover/img-item:scale-105 transition-transform duration-500 ease-out cursor-pointer"
                                onClick={() => handlePreview(0)}
                              />
                            </div>
                          </div>
                        );
                      }

                      // 2 ảnh
                      if (urls.length === 2) {
                        return (
                          <div className="grid grid-cols-2 gap-2.5 mt-3 max-w-md">
                            {urls.map((url, idx) => (
                              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border shadow-xs hover:shadow-md transition-all group/img-item">
                                <img 
                                  src={url} 
                                  alt={`${m.title} ${idx + 1}`} 
                                  className="size-full object-cover group-hover/img-item:scale-105 transition-transform duration-500 ease-out cursor-pointer"
                                  onClick={() => handlePreview(idx)}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover/img-item:bg-black/10 transition-colors pointer-events-none" />
                              </div>
                            ))}
                          </div>
                        );
                      }

                      // 3 ảnh (1 ảnh lớn bên trái, 2 ảnh nhỏ bên phải)
                      if (urls.length === 3) {
                        return (
                          <div className="grid grid-cols-3 gap-2.5 mt-3 max-w-md h-[180px] sm:h-[220px]">
                            {/* Ảnh lớn bên trái */}
                            <div className="col-span-2 relative rounded-2xl overflow-hidden border shadow-xs hover:shadow-md transition-all group/img-item h-full">
                              <img 
                                src={urls[0]} 
                                alt={`${m.title} 1`} 
                                className="size-full object-cover group-hover/img-item:scale-105 transition-transform duration-500 ease-out cursor-pointer"
                                onClick={() => handlePreview(0)}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover/img-item:bg-black/10 transition-colors pointer-events-none" />
                            </div>
                            {/* 2 ảnh nhỏ bên phải */}
                            <div className="flex flex-col gap-2.5 h-full">
                              {urls.slice(1, 3).map((url, idx) => (
                                <div key={idx} className="flex-1 relative rounded-xl overflow-hidden border shadow-xs hover:shadow-md transition-all group/img-item">
                                  <img 
                                    src={url} 
                                    alt={`${m.title} ${idx + 2}`} 
                                    className="size-full object-cover group-hover/img-item:scale-105 transition-transform duration-500 ease-out cursor-pointer"
                                    onClick={() => handlePreview(idx + 1)}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover/img-item:bg-black/10 transition-colors pointer-events-none" />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      // 4 ảnh trở lên (Hiển thị dạng grid 2x2, ảnh thứ 4 có overlay +N ảnh còn lại)
                      const displayUrls = urls.slice(0, 4);
                      const hasMore = urls.length > 4;
                      const moreCount = urls.length - 4;

                      return (
                        <div className="grid grid-cols-2 gap-2.5 mt-3 max-w-md">
                          {displayUrls.map((url, idx) => {
                            const isLast = idx === 3 && hasMore;
                            return (
                              <div 
                                key={idx} 
                                className="relative aspect-square rounded-2xl overflow-hidden border shadow-xs hover:shadow-md transition-all group/img-item"
                              >
                                <img 
                                  src={url} 
                                  alt={`${m.title} ${idx + 1}`} 
                                  className="size-full object-cover group-hover/img-item:scale-105 transition-transform duration-500 ease-out cursor-pointer"
                                  onClick={() => handlePreview(idx)}
                                />
                                {isLast ? (
                                  <div 
                                    onClick={() => handlePreview(idx)}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white cursor-pointer hover:bg-black/50 transition-colors"
                                  >
                                    <span className="text-xl font-black">+{moreCount}</span>
                                    <span className="text-[10px] font-bold tracking-wider uppercase opacity-85">ảnh khác</span>
                                  </div>
                                ) : (
                                  <div className="absolute inset-0 bg-black/0 group-hover/img-item:bg-black/10 transition-colors pointer-events-none" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT ANNIVERSARY DIALOG */}
      <Dialog open={isEditAnniversaryOpen} onOpenChange={setIsEditAnniversaryOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className={cn("flex items-center gap-2.5", theme.text)}>
              <CalendarIcon className={cn("size-5", theme.textRoseColor)} />
              Thay đổi Ngày Kỷ niệm
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Cập nhật ngày bắt đầu yêu nhau của hai bạn. Số ngày sẽ tự động tính toán lại.
            </DialogDescription>
          </DialogHeader>
          <div className="py-5 space-y-2 flex flex-col">
            <label className="text-xs font-bold text-muted-foreground/80 tracking-wider uppercase block">Ngày bắt đầu</label>
            <Popover open={openAnnivCalendar} onOpenChange={setOpenAnnivCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full rounded-2xl border-input px-3.5 h-11 justify-start text-left font-normal bg-card hover:bg-muted/30 focus:ring-2",
                    theme.ringFocusCalendar,
                    !newAnniversaryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2.5 h-4 w-4 text-muted-foreground shrink-0" />
                  {newAnniversaryDate ? format(newAnniversaryDate, 'dd/MM/yyyy') : <span>Chọn ngày...</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl border shadow-lg" align="start">
                <Calendar
                  mode="single"
                  selected={newAnniversaryDate}
                  onSelect={(newDate) => {
                    if (newDate) {
                      setNewAnniversaryDate(newDate);
                      setOpenAnnivCalendar(false);
                    }
                  }}
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter className="pt-4 border-t flex flex-row items-center justify-end gap-2.5 bg-muted/5 -mx-6 -mb-6 p-4 sm:p-6">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setIsEditAnniversaryOpen(false)} 
              className="flex-1 sm:flex-none rounded-xl cursor-pointer hover:bg-muted/80 h-10"
            >
              Hủy
            </Button>
            <Button 
              type="button"
              onClick={handleAnniversarySubmit}
              disabled={isUpdatingAnniversary}
              className={cn(
                "flex-1 sm:flex-none shadow-sm hover:shadow transition-all rounded-xl cursor-pointer h-10",
                theme.bg,
                theme.bgHover
              )}
            >
              {isUpdatingAnniversary ? 'Đang lưu...' : 'Lưu Thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD/EDIT MILESTONE DIALOG */}
      <Dialog open={isMilestoneDialogOpen} onOpenChange={setIsMilestoneDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl h-[85vh] md:h-auto max-h-[85vh] md:max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b shrink-0">
            <DialogTitle className={cn("flex items-center gap-2.5", theme.text)}>
              <Heart className={cn("size-5 animate-pulse", theme.textRoseColor, theme.fillColor)} />
              {editingMilestone ? 'Chỉnh sửa Cột mốc Kỷ niệm' : 'Thêm Cột mốc Kỷ niệm'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Ghi lại một thời khắc đẹp trên hành trình yêu thương.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
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
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground/80 tracking-wider uppercase block">Ảnh kỷ niệm (Tối đa nhiều ảnh)</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Dán link URL ảnh hoặc bấm Tải lên..."
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
                    className="rounded-xl cursor-pointer h-11 px-3"
                  >
                    Thêm
                  </Button>
                )}
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => dialogMilestoneImageInputRef.current?.click()}
                  className="rounded-xl cursor-pointer hover:bg-muted h-11 px-4 min-w-[100px]"
                >
                  <Upload className="size-4 mr-1.5" /> Tải lên
                </Button>
                <input 
                  type="file"
                  ref={dialogMilestoneImageInputRef}
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleMultipleFilesUpload(e)}
                />
              </div>
              
              {/* Danh sách ảnh đã chọn */}
              {milestoneImageUrls.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3 p-2 border rounded-2xl bg-muted/10">
                  {milestoneImageUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border bg-background group/thumb">
                      <img 
                        src={url} 
                        alt={`Preview ${idx + 1}`} 
                        className="size-full object-cover"
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
                  <PopoverContent className="w-auto p-0 border-none shadow-2xl z-[99999]" align="center">
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
          <DialogFooter className="p-4 sm:p-6 border-t flex flex-row items-center justify-end gap-2.5 bg-zinc-50 dark:bg-zinc-950/20 shrink-0">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setIsMilestoneDialogOpen(false)} 
              className="flex-1 sm:flex-none rounded-xl cursor-pointer hover:bg-muted/80 h-10 px-4"
            >
              Hủy
            </Button>
            <Button 
              type="button"
              onClick={handleMilestoneSubmit}
              disabled={isCreatingMilestone || isUpdatingMilestone || !milestoneTitle || !milestoneDate}
              className={cn("flex-1 sm:flex-none shadow-sm hover:shadow transition-all rounded-xl cursor-pointer h-10 px-5", theme.bg, theme.bgHover)}
            >
              {isCreatingMilestone || isUpdatingMilestone ? 'Đang lưu...' : 'Lưu kỷ niệm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CUSTOMIZE INTERFACE DIALOG */}
      <Dialog open={isCustomizeDialogOpen} onOpenChange={setIsCustomizeDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl h-[85vh] md:h-auto max-h-[85vh] md:max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b shrink-0">
            <DialogTitle className={cn("flex items-center gap-2.5 font-bold", theme.text)}>
              <Palette className={cn("size-5", theme.textRoseColor)} />
              Tùy chỉnh Giao diện Ngày bên nhau
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Thay đổi ảnh đại diện riêng biệt và hình nền trang trí của hai bạn.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* 0. Thông tin biệt danh và Ngày sinh */}
            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl border", theme.bgLight, theme.border)}>
              {/* Bạn */}
              <div className="space-y-2 flex flex-col">
                <label className={cn("text-xs font-bold tracking-wider uppercase block", theme.text)}>Biệt danh của bạn</label>
                <Input 
                  placeholder="Nhập biệt danh của bạn..."
                  value={myNicknameState}
                  onChange={(e) => setMyNicknameState(e.target.value)}
                  className={cn("rounded-xl h-10 bg-background", theme.ringFocus)}
                />
                
                <label className={cn("text-xs font-bold tracking-wider uppercase block pt-1", theme.text)}>Ngày sinh của bạn</label>
                <Popover open={openMyBirthdateCalendar} onOpenChange={setOpenMyBirthdateCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full rounded-xl border-input px-3 h-10 justify-start text-left font-normal bg-background hover:bg-muted/30 focus:ring-2",
                        theme.ringFocusCalendar,
                        !myBirthdateState && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                      {myBirthdateState ? format(new Date(myBirthdateState), 'dd/MM/yyyy') : <span>Chọn ngày sinh...</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl border shadow-lg" align="start">
                    <Calendar
                      mode="single"
                      captionLayout="dropdown"
                      startMonth={new Date(1940, 0)}
                      endMonth={new Date()}
                      selected={myBirthdateState ? new Date(myBirthdateState) : undefined}
                      onSelect={(newDate) => {
                        if (newDate) {
                          setMyBirthdateState(format(newDate, 'yyyy-MM-dd'));
                          setOpenMyBirthdateCalendar(false);
                        }
                      }}
                      disabled={{ after: new Date() }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Người ấy */}
              <div className="space-y-2 flex flex-col">
                <label className={cn("text-xs font-bold tracking-wider uppercase block", theme.text)}>Biệt danh người ấy</label>
                <Input 
                  placeholder="Nhập biệt danh người ấy..."
                  value={partnerNicknameState}
                  onChange={(e) => setPartnerNicknameState(e.target.value)}
                  className={cn("rounded-xl h-10 bg-background", theme.ringFocus)}
                />
                
                <label className={cn("text-xs font-bold tracking-wider uppercase block pt-1", theme.text)}>Ngày sinh người ấy</label>
                <Popover open={openPartnerBirthdateCalendar} onOpenChange={setOpenPartnerBirthdateCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full rounded-xl border-input px-3 h-10 justify-start text-left font-normal bg-background hover:bg-muted/30 focus:ring-2",
                        theme.ringFocusCalendar,
                        !partnerBirthdateState && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                      {partnerBirthdateState ? format(new Date(partnerBirthdateState), 'dd/MM/yyyy') : <span>Chọn ngày sinh...</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl border shadow-lg" align="start">
                    <Calendar
                      mode="single"
                      captionLayout="dropdown"
                      startMonth={new Date(1940, 0)}
                      endMonth={new Date()}
                      selected={partnerBirthdateState ? new Date(partnerBirthdateState) : undefined}
                      onSelect={(newDate) => {
                        if (newDate) {
                          setPartnerBirthdateState(format(newDate, 'yyyy-MM-dd'));
                          setOpenPartnerBirthdateCalendar(false);
                        }
                      }}
                      disabled={{ after: new Date() }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 1. Avatar của bạn */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground/80 tracking-wider uppercase block">Ảnh đại diện của bạn</label>
                {myAvatarUrl && (
                  <button 
                    type="button" 
                    disabled={uploadProgress !== null}
                    onClick={() => handleResetCustomize('myAvatar')}
                    className={cn("text-xs hover:underline flex items-center gap-1 cursor-pointer font-medium disabled:opacity-50 disabled:no-underline", theme.textRoseColor)}
                  >
                    <RefreshCw className="size-3" /> Khôi phục mặc định
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Dán link URL ảnh của bạn..."
                  value={myAvatarUrl}
                  disabled={uploadProgress !== null}
                  onChange={(e) => setMyAvatarUrl(e.target.value)}
                  className={cn("rounded-xl flex-1 h-11", theme.ringFocus)}
                />
                <Button 
                  type="button"
                  variant="outline"
                  disabled={uploadProgress !== null}
                  onClick={() => dialogMyAvatarInputRef.current?.click()}
                  className="rounded-xl cursor-pointer hover:bg-muted h-11 px-4 min-w-[100px]"
                >
                  <Upload className="size-4 mr-1.5" /> Tải lên
                </Button>
                <input 
                  type="file"
                  ref={dialogMyAvatarInputRef}
                  className="hidden"
                  accept="image/*"
                  disabled={uploadProgress !== null}
                  onChange={(e) => handleFileUpload(e, 'myAvatar')}
                />
              </div>
            </div>

            {/* 2. Avatar của người yêu */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground/80 tracking-wider uppercase block">Ảnh đại diện của đối phương</label>
                {partnerAvatarUrlState && (
                  <button 
                    type="button" 
                    disabled={uploadProgress !== null}
                    onClick={() => handleResetCustomize('partnerAvatar')}
                    className={cn("text-xs hover:underline flex items-center gap-1 cursor-pointer font-medium disabled:opacity-50 disabled:no-underline", theme.textRoseColor)}
                  >
                    <RefreshCw className="size-3" /> Khôi phục mặc định
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Dán link URL ảnh người ấy..."
                  value={partnerAvatarUrlState}
                  disabled={uploadProgress !== null}
                  onChange={(e) => setPartnerAvatarUrlState(e.target.value)}
                  className={cn("rounded-xl flex-1 h-11", theme.ringFocus)}
                />
                <Button 
                  type="button"
                  variant="outline"
                  disabled={uploadProgress !== null}
                  onClick={() => dialogPartnerAvatarInputRef.current?.click()}
                  className="rounded-xl cursor-pointer hover:bg-muted h-11 px-4 min-w-[100px]"
                >
                  <Upload className="size-4 mr-1.5" /> Tải lên
                </Button>
                <input 
                  type="file"
                  ref={dialogPartnerAvatarInputRef}
                  className="hidden"
                  accept="image/*"
                  disabled={uploadProgress !== null}
                  onChange={(e) => handleFileUpload(e, 'partnerAvatar')}
                />
              </div>
            </div>

            {/* 3. Hình nền kỷ niệm */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground/80 tracking-wider uppercase block">Hình nền kỷ niệm (Background)</label>
                {backgroundUrlState && (
                  <button 
                    type="button" 
                    disabled={uploadProgress !== null}
                    onClick={() => handleResetCustomize('background')}
                    className={cn("text-xs hover:underline flex items-center gap-1 cursor-pointer font-medium disabled:opacity-50 disabled:no-underline", theme.textRoseColor)}
                  >
                    <RefreshCw className="size-3" /> Khôi phục mặc định
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Dán link URL ảnh nền..."
                  value={backgroundUrlState}
                  disabled={uploadProgress !== null}
                  onChange={(e) => setBackgroundUrlState(e.target.value)}
                  className={cn("rounded-xl flex-1 h-11", theme.ringFocus)}
                />
                <Button 
                  type="button"
                  variant="outline"
                  disabled={uploadProgress !== null}
                  onClick={() => dialogBackgroundInputRef.current?.click()}
                  className="rounded-xl cursor-pointer hover:bg-muted h-11 px-4 min-w-[100px]"
                >
                  <Upload className="size-4 mr-1.5" /> Tải lên
                </Button>
                <input 
                  type="file"
                  ref={dialogBackgroundInputRef}
                  className="hidden"
                  accept="image/*"
                  disabled={uploadProgress !== null}
                  onChange={(e) => handleFileUpload(e, 'background')}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Khuyên dùng ảnh phong cảnh tỉ lệ rộng, dung lượng dưới 5MB. Cloudinary sẽ tự động tối ưu hóa khi hiển thị.
              </p>
            </div>

            {/* 4. Tùy chỉnh màu sắc chủ đạo */}
            <div className={cn("flex flex-col gap-3.5 p-4 rounded-2xl border bg-card/50", theme.border)}>
              <div className="space-y-0.5">
                <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Palette className={cn("size-4", theme.textRoseColor)} />
                  Tông màu giao diện (Theme)
                </label>
                <p className="text-xs text-muted-foreground leading-normal">
                  Cá nhân hóa tông màu chủ đạo của trang theo sở thích của hai bạn.
                </p>
              </div>
              
              <div className="flex items-center gap-3 pt-1">
                {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((key) => {
                  const t = THEMES[key];
                  const isSelected = loveThemeState === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setLoveThemeState(key)}
                      className={cn(
                        "size-8 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer relative active:scale-90",
                        isSelected 
                          ? "border-foreground scale-110 shadow" 
                          : "border-transparent opacity-80 hover:opacity-100 hover:scale-105"
                      )}
                      style={{ backgroundColor: t.primary }}
                      title={t.name}
                    >
                      {isSelected && (
                        <span className="size-2 bg-white rounded-full shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-6 border-t flex flex-row items-center justify-end gap-2.5 bg-zinc-50 dark:bg-zinc-950/20 shrink-0">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setIsCustomizeDialogOpen(false)} 
              className="flex-1 sm:flex-none rounded-xl cursor-pointer hover:bg-muted/80 h-10"
            >
              Hủy
            </Button>
            <Button 
              type="button"
              onClick={handleCustomizeSubmit}
              disabled={isUpdatingCustomize || uploadProgress !== null}
              className={cn(
                "flex-1 sm:flex-none shadow-sm hover:shadow transition-all rounded-xl cursor-pointer h-10",
                theme.bg,
                theme.bgHover
              )}
            >
              {isUpdatingCustomize ? 'Đang lưu...' : 'Lưu Thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* POPUP UPLOAD PROGRESS LOADING */}
      <Dialog open={uploadProgress !== null}>
        <DialogContent className={cn("sm:max-w-[360px] p-6 rounded-3xl border bg-background/85 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center text-center outline-none select-none pointer-events-none [&>button]:hidden z-[9999]", theme.border)}>
          {/* Vòng tròn Progress SVG */}
          <div className="relative size-24 flex items-center justify-center mb-4">
            {/* SVG Background Circle */}
            <svg className="absolute inset-0 size-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                className={cn(theme.progressBg)}
                strokeWidth="6"
                fill="transparent"
              />
              {/* SVG Foreground Progress Circle */}
              <circle
                cx="48"
                cy="48"
                r="40"
                className={cn("transition-all duration-300 ease-out", theme.progressStroke)}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={((100 - (uploadProgress ?? 0)) / 100) * (2 * Math.PI * 40)}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Heart or icon inside progress circle */}
            <div className="absolute flex flex-col items-center justify-center">
              <Heart className={cn("size-8 animate-pulse mb-0.5", theme.textRoseColor, theme.fillColor)} />
              <span className={cn("text-sm font-black tabular-nums", theme.text)}>
                {uploadProgress}%
              </span>
            </div>
          </div>

          <DialogTitle className="text-base font-bold text-foreground mb-1">
            Đang tải ảnh lên...
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground max-w-[250px]">
            {uploadTarget === 'background' 
              ? 'Đang tối ưu hóa hình nền kỷ niệm của hai bạn'
              : uploadTarget === 'myAvatar'
                ? 'Đang cập nhật ảnh đại diện của bạn'
                : uploadTarget === 'partnerAvatar'
                  ? 'Đang cập nhật ảnh đại diện của người ấy'
                  : 'Đang tải ảnh cột mốc kỷ niệm lên'}
          </DialogDescription>
        </DialogContent>
      </Dialog>

      {/* MOBILE-FIRST IMAGE LIGHTBOX PREVIEW */}
      {activePreviewUrls && activePreviewUrls.length > 0 && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[99999] flex flex-col items-center justify-center select-none animate-fade-in touch-none">
          {/* Nút đóng ở góc trên bên phải */}
          <button
            onClick={() => setActivePreviewUrls(null)}
            className="absolute top-4 right-4 z-50 p-2.5 bg-zinc-900/60 hover:bg-zinc-800/80 text-white rounded-full transition-colors cursor-pointer border border-white/5 active:scale-95 flex items-center justify-center"
            title="Đóng preview"
          >
            <X className="size-5" />
          </button>

          {/* Chỉ số ảnh hiện tại */}
          {activePreviewUrls.length > 1 && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 bg-zinc-900/60 text-white text-xs font-extrabold tracking-wider rounded-full border border-white/5 shadow-inner">
              {activePreviewIdx + 1} / {activePreviewUrls.length}
            </div>
          )}

          {/* Vùng xem ảnh ở trung tâm */}
          <div 
            className="relative w-full flex-1 flex items-center justify-center p-4 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Nút Previous */}
            {activePreviewUrls.length > 1 && activePreviewIdx > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePreviewIdx(prev => prev - 1);
                  setZoomActive(false);
                }}
                className="absolute left-4 z-40 hidden md:flex items-center justify-center p-3 bg-zinc-900/60 hover:bg-zinc-800/80 text-white rounded-full transition-all cursor-pointer border border-white/5 active:scale-95 shadow-lg"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}

            {/* Ảnh chính */}
            <div 
              style={getTransformStyle()}
              className="flex items-center justify-center max-w-full max-h-[85vh] transition-transform duration-300"
              onClick={handleImageClick}
            >
              <img 
                src={activePreviewUrls[activePreviewIdx]} 
                alt="Kỷ niệm preview" 
                className={cn(
                  "max-w-full max-h-[85vh] select-none pointer-events-none rounded-sm transition-transform ease-out duration-300",
                  zoomActive 
                    ? "scale-175 cursor-zoom-out object-contain overflow-auto" 
                    : "scale-100 object-contain"
                )}
              />
            </div>

            {/* Nút Next */}
            {activePreviewUrls.length > 1 && activePreviewIdx < activePreviewUrls.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePreviewIdx(prev => prev + 1);
                  setZoomActive(false);
                }}
                className="absolute right-4 z-40 hidden md:flex items-center justify-center p-3 bg-zinc-900/60 hover:bg-zinc-800/80 text-white rounded-full transition-all cursor-pointer border border-white/5 active:scale-95 shadow-lg"
              >
                <ChevronRight className="size-6" />
              </button>
            )}
          </div>

          {/* Gợi ý cử chỉ ở dưới cùng */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 text-center opacity-40 text-[10px] md:text-xs text-white/70 font-medium tracking-wide">
            {activePreviewUrls.length > 1 ? "Vuốt trái/phải để chuyển ảnh • Vuốt xuống để đóng" : "Vuốt lên/xuống để đóng • Nhấp đúp để zoom"}
          </div>
        </div>
      )}
    </div>
  );
}
