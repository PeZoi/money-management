'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Palette, Upload, RefreshCw } from 'lucide-react';
import { LoveTheme, THEMES, LoveConnection } from '../constants';
import { useCustomizeDialog } from '../hooks/use-customize-dialog';
import { UploadProgressDialog } from './upload-progress-dialog';
import { ImageCropperDialog } from '@/components/love/image-cropper-dialog';

interface CustomizeDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  loveConn: LoveConnection;
  theme: LoveTheme;
}

export function CustomizeDialog({
  isOpen,
  setIsOpen,
  loveConn,
  theme,
}: CustomizeDialogProps) {
  const {
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
    isSaving
  } = useCustomizeDialog({ loveConn, isOpen, setIsOpen });
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg rounded-3xl h-auto max-h-[90dvh] sm:max-h-[85vh] overflow-y-auto p-5 md:p-6 space-y-5" disableScroll>
        <DialogHeader className="pb-3 border-b border-border/40 shrink-0">
          <DialogTitle className={cn("flex items-center gap-2.5 font-bold", theme.text)}>
            <Palette className={cn("size-5", theme.textRoseColor)} />
            Tùy chỉnh Giao diện Ngày bên nhau
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Thay đổi ảnh đại diện riêng biệt và hình nền trang trí của hai bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
              <Popover open={openMyBirthdateCalendar} onOpenChange={setOpenMyBirthdateCalendar} modal={true}>
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
              <Popover open={openPartnerBirthdateCalendar} onOpenChange={setOpenPartnerBirthdateCalendar} modal={true}>
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
                    onClick={() => setLoveThemeState(key as 'rose' | 'primary' | 'ocean' | 'lavender' | 'sunset')}
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

        <div className="pt-4 border-t border-border/40 flex flex-row items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1 sm:flex-none rounded-xl cursor-pointer hover:bg-muted/80 h-10 px-4"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleCustomizeSubmit}
            disabled={isSaving || uploadProgress !== null}
            className={cn(
              "flex-1 sm:flex-none shadow-sm hover:shadow transition-all rounded-xl cursor-pointer h-10 px-5",
              theme.bg,
              theme.bgHover
            )}
          >
            {isSaving ? 'Đang lưu...' : 'Lưu Thay đổi'}
          </Button>
        </div>
      </DialogContent>

      <UploadProgressDialog
        uploadProgress={uploadProgress}
        uploadTarget={uploadTarget}
        theme={theme}
      />

      {cropperFile && cropperType && (
        <ImageCropperDialog
          open={cropperOpen}
          onOpenChange={(val) => {
            setCropperOpen(val);
            if (!val) setCropperFile(null);
          }}
          imageFile={cropperFile}
          aspect={cropperType === 'background' ? 16 / 9 : 1}
          cropShape={cropperType === 'background' ? 'rect' : 'round'}
          onCropSave={async (croppedFile: File) => {
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
    </Dialog>
  );
}
