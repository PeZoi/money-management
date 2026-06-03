'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { 
  useAdminLoveUsers, 
  useAdminLoveMutation 
} from '@/hooks/use-love';
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  Heart, 
  Search, 
  UserPlus, 
  UserMinus, 
  Calendar as CalendarIcon, 
  RefreshCw,
  Users,
  AlertTriangle
} from 'lucide-react';
import type { AdminLoveUser } from '@/types/database';

export default function AdminLovePage() {
  const { data: users = [], isLoading, isRefetching, refetch } = useAdminLoveUsers();
  const { connectUsers, disconnectUsers, isConnecting, isDisconnecting } = useAdminLoveMutation();

  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'connected' | 'single'>('all');

  // Dialog states
  const [isConnectOpen, setIsConnectOpen] = React.useState(false);
  const [selectedUser1, setSelectedUser1] = React.useState<AdminLoveUser | null>(null);
  const [selectedUser2Id, setSelectedUser2Id] = React.useState<string>('');
  const [anniversaryDate, setAnniversaryDate] = React.useState<Date | undefined>(new Date());
  const [openCalendar, setOpenCalendar] = React.useState(false);

  const [isDisconnectOpen, setIsDisconnectOpen] = React.useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = React.useState<string>('');
  const [disconnectPartnerName, setDisconnectPartnerName] = React.useState<string>('');

  // Lọc danh sách users
  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      
      const matchesFilter = 
        filter === 'all' ||
        (filter === 'connected' && user.connection_id) ||
        (filter === 'single' && !user.connection_id);

      return matchesSearch && matchesFilter;
    });
  }, [users, search, filter]);

  // Danh sách những người độc thân để bắt cặp làm User 2
  const singleUsers = React.useMemo(() => {
    return users.filter(u => !u.connection_id && u.id !== selectedUser1?.id);
  }, [users, selectedUser1]);

  const handleOpenConnect = (user: AdminLoveUser) => {
    setSelectedUser1(user);
    setSelectedUser2Id('');
    setAnniversaryDate(new Date());
    setOpenCalendar(false);
    setIsConnectOpen(true);
  };

  const handleConnectSubmit = async () => {
    if (!selectedUser1 || !selectedUser2Id || !anniversaryDate) return;
    
    try {
      await connectUsers({
        userId1: selectedUser1.id,
        userId2: selectedUser2Id,
        anniversaryDate: format(anniversaryDate, 'yyyy-MM-dd'),
      });
      setIsConnectOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDisconnect = (connectionId: string, u1: string, u2: string) => {
    setSelectedConnectionId(connectionId);
    setDisconnectPartnerName(`${u1} & ${u2}`);
    setIsDisconnectOpen(true);
  };

  const handleDisconnectSubmit = async () => {
    if (!selectedConnectionId) return;
    
    try {
      await disconnectUsers(selectedConnectionId);
      setIsDisconnectOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Thống kê nhanh
  const stats = React.useMemo(() => {
    const total = users.length;
    const connected = users.filter(u => u.connection_id).length;
    const couples = Math.floor(connected / 2);
    const single = total - connected;
    return { total, couples, single };
  }, [users]);

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Heart className="size-8 text-rose-500 fill-rose-500 animate-pulse" />
            Kết nối Tình yêu
          </h1>
          <p className="text-muted-foreground mt-1">
            Bắt cặp và kết nối các tài khoản người dùng trong hệ thống để kích hoạt nhật ký đếm ngày yêu nhau.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="cursor-pointer rounded-xl hover:bg-muted/50"
        >
          <RefreshCw className={`size-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Tải lại
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card hover:bg-card/90 transition-all rounded-xl p-5 border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Users className="size-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tổng người dùng</p>
            <h3 className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-12 mt-1" /> : stats.total}</h3>
          </div>
        </div>

        <div className="bg-card hover:bg-card/90 transition-all rounded-xl p-5 border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-500">
            <Heart className="size-6 fill-current animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Số cặp đang yêu</p>
            <h3 className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-12 mt-1" /> : stats.couples}</h3>
          </div>
        </div>

        <div className="bg-card hover:bg-card/90 transition-all rounded-xl p-5 border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400">
            <Heart className="size-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Chờ bắt cặp</p>
            <h3 className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-12 mt-1" /> : stats.single}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4.5" />
          <Input 
            placeholder="Tìm theo tên hoặc email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
            className="flex-1 sm:flex-none cursor-pointer rounded-xl"
          >
            Tất cả
          </Button>
          <Button 
            variant={filter === 'connected' ? 'default' : 'outline'}
            onClick={() => setFilter('connected')}
            size="sm"
            className="flex-1 sm:flex-none cursor-pointer text-rose-600 dark:text-rose-400 rounded-xl"
          >
            Đã bắt cặp
          </Button>
          <Button 
            variant={filter === 'single' ? 'default' : 'outline'}
            onClick={() => setFilter('single')}
            size="sm"
            className="flex-1 sm:flex-none cursor-pointer text-yellow-600 dark:text-yellow-500 rounded-xl"
          >
            Chưa bắt cặp
          </Button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            Không tìm thấy người dùng nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground text-sm font-semibold">
                  <th className="p-4 pl-6">Người dùng</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Kết nối với</th>
                  <th className="p-4">Ngày kỷ niệm</th>
                  <th className="p-4 pr-6 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                    {/* User Profile */}
                    <td className="p-4 pl-6 flex items-center gap-3">
                      <Avatar 
                        src={user.avatar_url} 
                        name={user.display_name} 
                        className="size-9 border" 
                        width={36} 
                        height={36} 
                      />
                      <span className="font-semibold block max-w-[150px] truncate">
                        {user.display_name}
                      </span>
                    </td>

                    {/* Email */}
                    <td className="p-4 text-muted-foreground">{user.email}</td>

                    {/* Status Badge */}
                    <td className="p-4">
                      {user.connection_id ? (
                        <Badge variant="default" className="bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50 rounded-full px-3 py-1">
                          Đã bắt cặp
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50/50 dark:text-yellow-500 dark:border-yellow-900/30 dark:bg-yellow-950/10 rounded-full px-3 py-1">
                          Độc thân
                        </Badge>
                      )}
                    </td>

                    {/* Partner display */}
                    <td className="p-4 font-medium">
                      {user.partner_name ? (
                        <span className="text-foreground flex items-center gap-1.5">
                          <Heart className="size-3.5 fill-rose-500 text-rose-500" />
                          {user.partner_name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>

                    {/* Anniversary date */}
                    <td className="p-4 text-muted-foreground">
                      {user.anniversary_date ? (
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon className="size-3.5" />
                          {new Date(user.anniversary_date).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      {user.connection_id ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenDisconnect(
                            user.connection_id!, 
                            user.display_name || 'User 1', 
                            user.partner_name || 'User 2'
                          )}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer rounded-xl"
                        >
                          <UserMinus className="size-4 mr-1.5" />
                          Hủy bắt cặp
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenConnect(user)}
                          className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/20 cursor-pointer rounded-xl"
                        >
                          <UserPlus className="size-4 mr-1.5" />
                          Bắt cặp
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONNECT DIALOG */}
      <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl overflow-hidden">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-rose-600 dark:text-rose-400">
              <Heart className="size-6 fill-rose-500 text-rose-500 animate-pulse" />
              Tạo Kết nối Cặp đôi
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Kết nối hai người dùng với nhau để bắt đầu đếm số ngày yêu.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-5">
            {/* User 1 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground/80 tracking-wider uppercase block">
                Người dùng 1
              </label>
              <div className="flex items-center gap-3.5 p-3.5 bg-rose-500/5 border border-rose-100 dark:border-rose-950/40 rounded-2xl">
                <Avatar 
                  src={selectedUser1?.avatar_url} 
                  name={selectedUser1?.display_name} 
                  className="size-10 border border-rose-200 dark:border-rose-900" 
                  width={40} 
                  height={40} 
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-foreground block text-sm">
                    {selectedUser1?.display_name}
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    {selectedUser1?.email}
                  </span>
                </div>
              </div>
            </div>

            {/* User 2 Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground/80 tracking-wider uppercase block">
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

            {/* Anniversary Date (Shadcn Date Picker) */}
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-bold text-muted-foreground/80 tracking-wider uppercase block">
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
          
          <DialogFooter className="pt-4 border-t flex flex-row items-center justify-end gap-2.5 sm:gap-3 bg-muted/5 -mx-6 -mb-6 p-4 sm:p-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsConnectOpen(false)} 
              className="flex-1 sm:flex-none rounded-xl cursor-pointer hover:bg-muted/80 h-10 px-4"
            >
              Hủy
            </Button>
            <Button 
              type="button"
              onClick={handleConnectSubmit}
              disabled={isConnecting || !selectedUser2Id}
              className="flex-1 sm:flex-none bg-rose-500 hover:bg-rose-600 text-white shadow-sm hover:shadow transition-all rounded-xl cursor-pointer h-10 px-5"
            >
              {isConnecting ? 'Đang kết nối...' : 'Xác nhận Kết nối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DISCONNECT DIALOG */}
      <Dialog open={isDisconnectOpen} onOpenChange={setIsDisconnectOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl overflow-hidden">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-destructive flex items-center gap-2.5 text-xl font-bold">
              <AlertTriangle className="size-6 text-destructive animate-pulse" />
              Hủy Kết nối Tình yêu
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Xóa hoàn toàn kết nối tình yêu. Các kỷ niệm liên quan cũng sẽ bị xóa vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Bạn có chắc chắn muốn hủy bắt cặp kết nối của cặp đôi:
            </p>
            <div className="text-lg font-black text-center py-4 text-rose-600 dark:text-rose-400 bg-rose-500/5 dark:bg-rose-950/20 rounded-2xl border border-rose-200/40 dark:border-rose-900/30">
              {disconnectPartnerName}
            </div>
          </div>
          
          <DialogFooter className="pt-4 border-t flex flex-row items-center justify-end gap-2.5 sm:gap-3 bg-muted/5 -mx-6 -mb-6 p-4 sm:p-6">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setIsDisconnectOpen(false)} 
              className="flex-1 sm:flex-none rounded-xl cursor-pointer hover:bg-muted/80 h-10 px-4"
            >
              Quay lại
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleDisconnectSubmit}
              disabled={isDisconnecting}
              className="flex-1 sm:flex-none cursor-pointer rounded-xl h-10 px-5 shadow-sm"
            >
              {isDisconnecting ? 'Đang hủy...' : 'Đồng ý Hủy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
