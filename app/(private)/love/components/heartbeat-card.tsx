'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Heart, Calendar as CalendarIcon, Edit3, Palette, Camera, Clock } from 'lucide-react';
import { LoveTheme, LoveConnection } from '../constants';
import { useHeartbeatCard } from '../hooks/use-heartbeat-card';
import { ImageCropperDialog } from '@/components/love/image-cropper-dialog';
import { UploadProgressDialog } from './upload-progress-dialog';

interface HeartbeatCardProps {
  loveConn: LoveConnection;
  user: { avatarUrl?: string | null; displayName?: string | null } | null | undefined;
  theme: LoveTheme;
  handleOpenCustomize: () => void;
  handleOpenEditAnniversary: () => void;
}

export function HeartbeatCard({
  loveConn,
  user,
  theme,
  handleOpenCustomize,
  handleOpenEditAnniversary,
}: HeartbeatCardProps) {
  const {
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
  } = useHeartbeatCard(loveConn, user);

  return (
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
        <div className={cn("absolute top-10 left-10 animate-pulse", loveConn.background_url ? "text-white/30" : theme.textRoseColor)}>
          <Heart className="size-6 fill-current" />
        </div>
        <div className={cn("absolute bottom-10 right-10 animate-pulse delay-500", loveConn.background_url ? "text-white/30" : theme.textRoseColor)}>
          <Heart className="size-8 fill-current" />
        </div>
        <div className={cn("absolute top-1/2 left-3/4 animate-pulse delay-1000", loveConn.background_url ? "text-white/30" : theme.textRoseColor)}>
          <Heart className="size-5 fill-current" />
        </div>
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
              <Heart className="size-8 md:size-10 animate-pulse fill-current" />
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
                src={loveConn.partner_avatar_url ?? undefined}
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
          <div className='mt-3'>
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

      {/* Upload Progress Popup nạp trực tiếp */}
      <UploadProgressDialog
        uploadProgress={uploadProgress}
        uploadTarget={uploadTarget}
        theme={theme}
      />

      {/* Image Cropper nạp trực tiếp */}
      {cropperFile && cropperType && (
        <ImageCropperDialog
          open={cropperOpen}
          onOpenChange={(val) => {
            setCropperOpen(val);
            if (!val) setCropperFile(null);
          }}
          imageFile={cropperFile}
          aspect={1}
          cropShape="round"
          onCropSave={async (croppedFile) => {
            setCropperOpen(false);
            setCropperFile(null);
            if (cropperType) {
              await uploadCroppedFile(croppedFile, cropperType);
            }
          }}
          theme={{
            bg: theme.bg,
            bgHover: theme.bgHover,
            text: theme.text,
            textRoseColor: theme.textRoseColor,
            ringFocusCalendar: theme.ringFocusCalendar,
          }}
        />
      )}
    </div>
  );
}
