'use client';

import * as React from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Helper tạo ảnh từ URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // Tránh lỗi CORS canvas taint
    image.src = url;
  });

// Helper cắt ảnh sử dụng HTML5 Canvas và trả về Blob
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob | null> {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Đặt kích thước canvas bằng vùng crop thực tế
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Vẽ vùng được chọn lên canvas
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.9 // Chất lượng ảnh 90%
      );
    });
  } catch (error) {
    console.error('Lỗi khi vẽ canvas cắt ảnh:', error);
    return null;
  }
}

interface ImageCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  aspect: number; // Tỉ lệ cắt (1 cho avatar, 16/9 cho background)
  cropShape?: 'rect' | 'round';
  onCropSave: (croppedFile: File) => Promise<void>;
  theme: {
    bg: string;
    bgHover: string;
    text: string;
    textRoseColor: string;
    ringFocusCalendar: string;
  };
}

export function ImageCropperDialog({
  open,
  onOpenChange,
  imageFile,
  aspect,
  cropShape = 'rect',
  onCropSave,
  theme,
}: ImageCropperDialogProps) {
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);
  const [imageSrc, setImageSrc] = React.useState<string>('');
  const [isSaving, setIsSaving] = React.useState(false);

  // Tạo Object URL khi nhận file gốc
  React.useEffect(() => {
    if (!imageFile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImageSrc('');
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImageSrc(objectUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const onCropComplete = React.useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels || !imageFile) return;

    try {
      setIsSaving(true);

      // Tiến hành cắt ảnh trên Canvas từ Object URL và thông số crop
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!blob) {
        throw new Error('Không thể cắt ảnh');
      }

      // Đổi tên file đã crop để giữ định dạng và tính nhất quán
      const fileExtension = imageFile.name.split('.').pop() || 'jpg';
      const croppedFile = new File(
        [blob],
        `cropped_${Date.now()}.${fileExtension}`,
        { type: blob.type }
      );

      // Đóng Dialog cắt ảnh ngay để giao diện sạch sẽ, tránh đè lên popup loading upload
      onOpenChange(false);

      // Gọi callback tải ảnh đã crop lên Cloudinary
      await onCropSave(croppedFile);
    } catch (error) {
      console.error('Cắt ảnh thất bại:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isSaving && onOpenChange(val)}>
      {/* Ép overflow-hidden bằng độ ưu tiên cao nhất để triệt tiêu scrollbar ngoài */}
      <DialogContent className="sm:max-w-md p-6 rounded-2xl !overflow-hidden [&>button]:hidden">
        {/* Ép overflow-hidden cho container trong để tránh tràn layout */}
        <div className="flex flex-col max-h-[80vh] !overflow-hidden">
          <DialogHeader className="pb-3 border-b shrink-0">
            <DialogTitle className={cn("text-lg font-bold", theme.text)}>
              Căn chỉnh hình ảnh
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Kéo thả để di chuyển, dùng thanh trượt để phóng to/thu nhỏ ảnh theo vùng bạn muốn hiển thị.
            </DialogDescription>
          </DialogHeader>

          {/* Khung chứa công cụ crop với chiều cao cố định để tránh lỗi tràn layout */}
          <div className="relative h-[280px] sm:h-[320px] w-full bg-zinc-950 rounded-2xl overflow-hidden mt-4 shadow-inner border border-muted/20 shrink-0">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                cropShape={cropShape}
                showGrid={true}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          {/* Thanh điều khiển Zoom */}
          <div className="py-4 space-y-2 shrink-0">
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground/80 tracking-wider">
              <span>PHÓNG TO</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              disabled={isSaving}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1.5 bg-muted dark:bg-muted/40 rounded-lg appearance-none cursor-pointer accent-current focus:outline-none"
              style={{ color: theme.bg.split(' ')[0].replace('bg-[', '').replace(']', '') }}
            />
          </div>

          {/* Footer nằm gọn gàng bên trong Dialog, loại bỏ margin âm để triệt tiêu hoàn toàn lỗi tràn ngang */}
          <DialogFooter className="pt-4 border-t flex flex-row items-center justify-end gap-2.5 shrink-0 mt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none rounded-xl cursor-pointer hover:bg-muted/80 h-10 px-5"
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className={cn(
                "flex-1 sm:flex-none shadow-sm hover:shadow transition-all rounded-xl cursor-pointer h-10 px-6",
                theme.bg,
                theme.bgHover
              )}
            >
              {isSaving ? 'Đang xử lý...' : 'Cắt & Tải lên'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
