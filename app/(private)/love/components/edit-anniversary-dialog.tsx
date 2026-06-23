'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Calendar as CalendarIcon } from 'lucide-react';
import { LoveTheme, LoveConnection } from '../constants';
import { useEditAnniversaryDialog } from '../hooks/use-edit-anniversary-dialog';

interface EditAnniversaryDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  loveConn: LoveConnection;
  theme: LoveTheme;
}

export function EditAnniversaryDialog({
  isOpen,
  setIsOpen,
  loveConn,
  theme,
}: EditAnniversaryDialogProps) {
  const {
    newAnniversaryDate,
    setNewAnniversaryDate,
    openAnnivCalendar,
    setOpenAnnivCalendar,
    handleAnniversarySubmit,
    isSaving,
  } = useEditAnniversaryDialog({ loveConn, isOpen, setIsOpen });
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md p-6 rounded-2xl overflow-hidden" disableScroll>
        <DialogHeader className="pb-4 border-b border-border/60">
          <DialogTitle className={cn("flex items-center gap-2.5 text-lg font-semibold", theme.text)}>
            <CalendarIcon className={cn("size-5", theme.textRoseColor)} />
            Thay đổi Ngày Kỷ niệm
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Cập nhật ngày bắt đầu yêu nhau của hai bạn. Số ngày sẽ tự động tính toán lại.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-2 flex flex-col">
          <label className="text-[10px] font-bold text-muted-foreground/60 tracking-wider uppercase block">Ngày bắt đầu</label>
          <Popover open={openAnnivCalendar} onOpenChange={setOpenAnnivCalendar} modal={true}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full rounded-xl border border-input px-3.5 h-11 justify-start text-left font-normal bg-card hover:bg-muted/30 focus:ring-2 transition-all duration-200",
                  theme.ringFocusCalendar,
                  !newAnniversaryDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2.5 h-4 w-4 text-muted-foreground shrink-0" />
                {newAnniversaryDate ? format(newAnniversaryDate, 'dd/MM/yyyy') : <span>Chọn ngày...</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl border shadow-xl bg-popover" align="start">
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
        <DialogFooter className="pt-4 border-t border-border/60 flex flex-row items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1 sm:flex-none rounded-xl cursor-pointer hover:bg-muted/80 h-10 px-4 font-medium transition-all"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleAnniversarySubmit}
            disabled={isSaving}
            className={cn(
              "flex-1 sm:flex-none shadow-sm hover:shadow-md transition-all rounded-xl cursor-pointer h-10 px-5 font-semibold text-white",
              theme.bg,
              theme.bgHover
            )}
          >
            {isSaving ? 'Đang lưu...' : 'Lưu Thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
