'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog';

import { LoveTheme } from '../constants';

interface UploadProgressDialogProps {
  uploadProgress: number | null;
  uploadTarget: 'myAvatar' | 'partnerAvatar' | 'background' | 'milestone' | null;
  theme: LoveTheme;
}

export function UploadProgressDialog({
  uploadProgress,
  uploadTarget,
  theme,
}: UploadProgressDialogProps) {
  const isOpen = uploadProgress !== null;

  return (
    <Dialog open={isOpen}>
      <DialogContent
        disableScroll
        disableMobileDrawer
        showCloseButton={false}
        className={cn(
          "w-[280px] sm:w-[320px] p-6 rounded-3xl border bg-background/85 backdrop-blur-md shadow-2xl outline-none select-none pointer-events-none z-[9999] flex flex-col items-center justify-center",
          theme.border
        )}
      >
        <div className="flex flex-col items-center justify-center text-center w-full">
          {/* Vòng tròn Progress SVG */}
          <div className="relative size-24 flex items-center justify-center mb-4">
            {/* SVG Background Circle */}
            <svg className="absolute inset-0 size-full -rotate-90 origin-center" viewBox="0 0 96 96">
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

          <DialogTitle className="text-base font-bold text-foreground mb-1 w-full text-center">
            Đang tải ảnh lên...
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground max-w-[240px] w-full text-center">
            {uploadTarget === 'background'
              ? 'Đang tối ưu hóa hình nền kỷ niệm của hai bạn'
              : uploadTarget === 'myAvatar'
                ? 'Đang cập nhật ảnh đại diện của bạn'
                : uploadTarget === 'partnerAvatar'
                  ? 'Đang cập nhật ảnh đại diện của người ấy'
                  : 'Đang tải ảnh cột mốc kỷ niệm lên'}
          </DialogDescription>
        </div>
      </DialogContent>
    </Dialog>
  );
}
