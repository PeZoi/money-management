'use client';

import * as React from 'react';
import { m } from 'framer-motion';
import { staggerContainer } from '@/lib/motion-variants';
import { format } from 'date-fns';
import { 
  useAdminLoveUsers, 
  useAdminLoveMutation 
} from '@/hooks/use-love';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  RefreshCw
} from 'lucide-react';
import type { AdminLoveUser } from '@/types/database';

// Import các component con
import { LoveStats } from './components/love-stats';
import { LoveFilters } from './components/love-filters';
import { LoveUsersTable } from './components/love-users-table';
import { ConnectDialog } from './components/connect-dialog';
import { DisconnectDialog } from './components/disconnect-dialog';

export default function AdminLovePage() {
  const { data: users = [], isLoading, isRefetching, refetch } = useAdminLoveUsers();
  const { connectUsers, disconnectUsers, isConnecting, isDisconnecting } = useAdminLoveMutation();

  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'connected' | 'single'>('all');

  // Dialog states
  const [isConnectOpen, setIsConnectOpen] = React.useState(false);
  const [selectedUser1, setSelectedUser1] = React.useState<AdminLoveUser | null>(null);

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
    setIsConnectOpen(true);
  };

  const handleConnectSubmit = async (userId2: string, anniversaryDate: Date) => {
    if (!selectedUser1) return;
    
    try {
      await connectUsers({
        userId1: selectedUser1.id,
        userId2,
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
    <m.div 
      className="container max-w-7xl mx-auto p-4 md:p-8 space-y-6"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
    >
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
      <LoveStats isLoading={isLoading} stats={stats} />

      {/* Filter and Search */}
      <LoveFilters 
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
      />

      {/* Users List */}
      <LoveUsersTable 
        users={filteredUsers}
        isLoading={isLoading}
        onOpenConnect={handleOpenConnect}
        onOpenDisconnect={handleOpenDisconnect}
      />

      {/* CONNECT DIALOG */}
      <ConnectDialog 
        key={isConnectOpen ? `connect-${selectedUser1?.id || 'new'}` : 'closed'}
        isOpen={isConnectOpen}
        onOpenChange={setIsConnectOpen}
        selectedUser1={selectedUser1}
        singleUsers={singleUsers}
        isConnecting={isConnecting}
        onConnect={handleConnectSubmit}
      />

      {/* DISCONNECT DIALOG */}
      <DisconnectDialog 
        isOpen={isDisconnectOpen}
        onOpenChange={setIsDisconnectOpen}
        partnerName={disconnectPartnerName}
        isDisconnecting={isDisconnecting}
        onDisconnect={handleDisconnectSubmit}
      />
    </m.div>
  );
}
