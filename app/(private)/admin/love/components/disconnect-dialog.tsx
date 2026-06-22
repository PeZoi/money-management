'use client';

import * as React from 'react';
import { Heart, AlertTriangle } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DisconnectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  partnerName: string;
  isDisconnecting: boolean;
  onDisconnect: () => Promise<void>;
}

export function DisconnectDialog({
  isOpen,
  onOpenChange,
  partnerName,
  isDisconnecting,
  onDisconnect,
}: DisconnectDialogProps) {
  const names = partnerName.split('&');
  const p1 = names[0]?.trim() || '';
  const p2 = names[1]?.trim() || '';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent disableScroll className="sm:max-w-md p-6 rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex flex-col items-center text-center pt-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 shrink-0">
            <AlertTriangle className="size-6 animate-pulse" />
          </div>
          <DialogTitle className="text-xl font-extrabold tracking-tight mt-4 text-foreground">
            Hủy Kết nối Tình yêu
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2 max-w-xs">
            Hành động này sẽ xóa hoàn toàn kết nối cặp đôi và toàn bộ kỷ niệm liên quan vĩnh viễn.
          </DialogDescription>
        </div>
        
        <div className="py-6 space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground/80 tracking-widest uppercase text-center">
            Cặp đôi sẽ bị hủy kết nối
          </p>
          
          <div className="flex items-center justify-center gap-4 py-4 px-5 bg-muted/30 dark:bg-muted/10 rounded-2xl border border-border/40">
            <span className="font-bold text-sm text-foreground/95 truncate max-w-[130px]">
              {p1}
            </span>
            <div className="flex items-center justify-center size-8 rounded-full bg-rose-500/10 text-rose-500 shrink-0">
              <Heart className="size-4 fill-rose-500/20" />
            </div>
            <span className="font-bold text-sm text-foreground/95 truncate max-w-[130px]">
              {p2}
            </span>
          </div>
        </div>
        
        <DialogFooter className="grid grid-cols-2 gap-3 mt-4 pt-0">
          <Button 
            type="button"
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="rounded-xl font-semibold cursor-pointer border-muted-foreground/20 hover:bg-muted/50 h-11"
          >
            Quay lại
          </Button>
          <Button 
            type="button"
            variant="destructive"
            onClick={onDisconnect}
            disabled={isDisconnecting}
            className="rounded-xl font-semibold cursor-pointer bg-red-600 hover:bg-red-700 text-white h-11 shadow-sm"
          >
            {isDisconnecting ? 'Đang hủy...' : 'Đồng ý Hủy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
