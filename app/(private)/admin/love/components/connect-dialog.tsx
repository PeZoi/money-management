'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Heart, 
  Calendar as CalendarIcon 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { AdminLoveUser } from '@/types/database';

interface ConnectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser1: AdminLoveUser | null;
  singleUsers: AdminLoveUser[];
  isConnecting: boolean;
  onConnect: (userId2: string, anniversaryDate: Date) => Promise<void>;
}

export function ConnectDialog({
  isOpen,
  onOpenChange,
  selectedUser1,
  singleUsers,
  isConnecting,
  onConnect,
}: ConnectDialogProps) {
  const [selectedUser2Id, setSelectedUser2Id] = React.useState<string>('');
  const [anniversaryDate, setAnniversaryDate] = React.useState<Date | undefined>(new Date());
  const [openCalendar, setOpenCalendar] = React.useState(false);
  const handleSubmit = async () => {
    if (!selectedUser2Id || !anniversaryDate) return;
    await onConnect(selectedUser2Id, anniversaryDate);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent disableScroll className="sm:max-w-md p-6 rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex flex-col items-center text-center pt-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 shrink-0">
            <Heart className="size-6 fill-rose-500 animate-pulse" />
          </div>
          <DialogTitle className="text-xl font-extrabold tracking-tight mt-4 text-foreground">
            Tạo Kết nối Cặp đôi
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2 max-w-xs">
            Kết nối hai tài khoản để kích hoạt nhật ký đếm ngày yêu nhau của họ.
          </DialogDescription>
        </div>
        
        <div className="space-y-4 py-5">
          {/* User 1 */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground/80 tracking-widest uppercase block">
              Người dùng 1
            </label>
            <div className="flex items-center gap-3 p-3 bg-muted/40 dark:bg-muted/10 border border-border/40 rounded-2xl">
              <Avatar 
                src={selectedUser1?.avatar_url} 
                name={selectedUser1?.display_name} 
                className="size-9 border border-rose-200 dark:border-rose-900" 
                width={36} 
                height={36} 
              />
              <div className="space-y-0.5 min-w-0">
                <span className="font-bold text-foreground block text-sm truncate">
                  {selectedUser1?.display_name}
                </span>
                <span className="text-xs text-muted-foreground block truncate">
                  {selectedUser1?.email}
                </span>
              </div>
            </div>
          </div>

          {/* User 2 Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground/80 tracking-widest uppercase block">
              Người dùng 2 (Đối tác)
            </label>
            {singleUsers.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-destructive/5 border border-destructive/20 text-xs text-destructive font-medium">
                Không còn người dùng nào khác đang độc thân để bắt cặp.
              </div>
            ) : (
              <Select value={selectedUser2Id} onValueChange={setSelectedUser2Id}>
                <SelectTrigger className="w-full rounded-2xl border-input px-3.5 h-11 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500">
                  <SelectValue placeholder="Chọn người để bắt cặp..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {singleUsers.map(u => (
                    <SelectItem key={u.id} value={u.id} className="cursor-pointer rounded-lg">
                      {u.display_name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Anniversary Date */}
          <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-bold text-muted-foreground/80 tracking-widest uppercase block">
              Ngày bắt đầu yêu nhau
            </label>
            <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full rounded-2xl border-input px-3.5 h-11 justify-start text-left font-normal bg-card hover:bg-muted/30 focus:ring-2 focus:ring-rose-500/20",
                    !anniversaryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2.5 h-4 w-4 text-muted-foreground shrink-0" />
                  {anniversaryDate ? format(anniversaryDate, 'dd/MM/yyyy') : <span>Chọn ngày...</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl border shadow-lg" align="start">
                <Calendar
                  mode="single"
                  selected={anniversaryDate}
                  onSelect={(newDate) => {
                    if (newDate) {
                      setAnniversaryDate(newDate);
                      setOpenCalendar(false);
                    }
                  }}
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <DialogFooter className="grid grid-cols-2 gap-3 mt-4 pt-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="rounded-xl font-semibold cursor-pointer hover:bg-muted/80 h-11"
          >
            Hủy
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit}
            disabled={isConnecting || !selectedUser2Id}
            className="bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-sm hover:shadow transition-all rounded-xl cursor-pointer h-11"
          >
            {isConnecting ? 'Đang kết nối...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
