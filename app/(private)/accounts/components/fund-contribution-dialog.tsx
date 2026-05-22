/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2Icon, CoinsIcon, ArrowRightIcon, WalletIcon, LandmarkIcon, HelpCircleIcon } from 'lucide-react';

import type { AccountRow } from '@/types/database';
import { useAuth } from '@/hooks/use-auth';
import { useWorkspaceStore } from '@/hooks/use-workspace';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type FundContributionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

// Định dạng số tiền nhập vào
function formatAmountInput(val: string | number): string {
  const str = String(val);
  const clean = str.replace(/[^0-9]/g, '');
  if (!clean) return '';
  return Number(clean).toLocaleString('en-US');
}

export default function FundContributionDialog({ open, onOpenChange, onSuccess }: FundContributionDialogProps) {
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspaceStore();
  const queryClient = useQueryClient();

  const [personalAccountId, setPersonalAccountId] = useState<string>('');
  const [groupAccountId, setGroupAccountId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // 1. Tìm workspace cá nhân
  const personalWorkspace = user?.workspaces?.find((w) => w.is_personal);
  const groupWorkspace = user?.workspaces?.find((w) => w.id === activeWorkspaceId);

  // 2. Fetch danh sách tài khoản cá nhân (nguồn)
  const { data: personalAccounts = [], isLoading: isLoadingPersonal } = useQuery<AccountRow[]>({
    queryKey: ['accounts', personalWorkspace?.id],
    queryFn: async () => {
      if (!personalWorkspace?.id) return [];
      const res = await fetch(`/api/accounts?workspace_id=${personalWorkspace.id}`);
      if (!res.ok) throw new Error('Không thể tải tài khoản cá nhân');
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!personalWorkspace?.id && open,
  });

  // 3. Fetch danh sách tài khoản nhóm (đích)
  const { data: groupAccounts = [], isLoading: isLoadingGroup } = useQuery<AccountRow[]>({
    queryKey: ['accounts', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return [];
      const res = await fetch(`/api/accounts?workspace_id=${activeWorkspaceId}`);
      if (!res.ok) throw new Error('Không thể tải tài khoản nhóm');
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!activeWorkspaceId && open,
  });

  // Reset states khi mở dialog
  useEffect(() => {
    if (open) {
      setPersonalAccountId('');
      setGroupAccountId('');
      setAmount('');
      setNote('');
    }
  }, [open]);

  // Tự động set tài khoản đầu tiên khi danh sách load xong
  useEffect(() => {
    if (personalAccounts.length > 0 && !personalAccountId) {
      // Ưu tiên tài khoản active
      const active = personalAccounts.find((a) => a.is_active);
      setPersonalAccountId(active?.id || personalAccounts[0].id);
    }
  }, [personalAccounts, personalAccountId]);

  useEffect(() => {
    if (groupAccounts.length > 0 && !groupAccountId) {
      const active = groupAccounts.find((a) => a.is_active);
      setGroupAccountId(active?.id || groupAccounts[0].id);
    }
  }, [groupAccounts, groupAccountId]);

  // Cập nhật note mặc định dựa trên thông tin workspace nhóm
  useEffect(() => {
    if (groupWorkspace?.name) {
      setNote(`Nộp quỹ nhóm ${groupWorkspace.name}`);
    } else {
      setNote('Đóng góp quỹ nhóm');
    }
  }, [groupWorkspace]);

  // Mutation gửi yêu cầu đóng quỹ
  const contributionMutation = useMutation({
    mutationFn: async (payload: {
      personal_workspace_id: string;
      personal_account_id: string;
      group_workspace_id: string;
      group_account_id: string;
      amount: number;
      note: string;
    }) => {
      const res = await fetch('/api/transactions/fund-contribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Nộp quỹ thất bại');
      return json;
    },
    onSuccess: () => {
      toast.success('Nộp quỹ nhóm thành công!');
      // Invalidate các query liên quan để cập nhật lại số dư và lịch sử giao dịch
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể thực hiện nộp quỹ nhóm');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!personalWorkspace?.id) {
      toast.error('Không tìm thấy tài khoản cá nhân.');
      return;
    }
    if (!activeWorkspaceId) {
      toast.error('Không tìm thấy tài khoản nhóm.');
      return;
    }
    if (!personalAccountId) {
      toast.error('Vui lòng chọn tài khoản cá nhân nguồn.');
      return;
    }
    if (!groupAccountId) {
      toast.error('Vui lòng chọn tài khoản nhóm nhận.');
      return;
    }

    const numAmount = Number(amount.replace(/[^0-9]/g, '')) || 0;
    if (numAmount <= 0) {
      toast.error('Số tiền nộp quỹ phải lớn hơn 0.');
      return;
    }

    contributionMutation.mutate({
      personal_workspace_id: personalWorkspace.id,
      personal_account_id: personalAccountId,
      group_workspace_id: activeWorkspaceId,
      group_account_id: groupAccountId,
      amount: numAmount,
      note: note.trim(),
    });
  };

  const isSubmitting = contributionMutation.isPending;
  const rawAmount = Number(amount.replace(/[^0-9]/g, '')) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} fullScreenOnMobile className="max-w-xl gap-0 p-0">
        <DialogHeader className="border-b px-5 py-4 sm:px-6 bg-linear-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CoinsIcon className="size-5" />
            </span>
            <DialogTitle className="text-lg font-bold">Đóng quỹ vào nhóm</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-6 sm:max-h-[75vh]">
            
            {/* Luồng chuyển tiền trực quan */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-2xl bg-muted/30 p-4 border border-border/40">
              {/* Nguồn: Cá nhân */}
              <div className="space-y-1 text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Từ cá nhân</p>
                <div className="font-semibold text-sm truncate text-foreground/90">
                  {personalWorkspace?.name || 'Workspace cá nhân'}
                </div>
              </div>

              {/* Mũi tên chuyển */}
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary border border-primary/20 animate-pulse">
                <ArrowRightIcon className="size-4" />
              </div>

              {/* Đích: Nhóm */}
              <div className="space-y-1 text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Đến quỹ nhóm</p>
                <div className="font-semibold text-sm truncate text-primary">
                  {groupWorkspace?.name || 'Workspace nhóm'}
                </div>
              </div>
            </div>

            {/* Bước 1: Chọn tài khoản nguồn (Cá nhân) */}
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                1. Chọn nguồn từ tài khoản cá nhân
              </Label>
              {isLoadingPersonal ? (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                  <Loader2Icon className="mr-2 size-4 animate-spin" /> Đang tải tài khoản cá nhân...
                </div>
              ) : personalAccounts.length === 0 ? (
                <p className="text-sm text-amber-500 italic">Bạn chưa tạo tài khoản cá nhân nào.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {personalAccounts.map((acc) => {
                    const isSelected = personalAccountId === acc.id;
                    const balanceNum = Number(acc.balance) || 0;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setPersonalAccountId(acc.id)}
                        disabled={isSubmitting}
                        className={cn(
                          'relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all outline-hidden cursor-pointer select-none',
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20'
                            : 'border-border bg-card hover:bg-muted/40',
                          isSubmitting && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div
                          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-xl border"
                          style={{
                            backgroundColor: `${acc.color}15`,
                            borderColor: `${acc.color}35`,
                          }}
                        >
                          {acc.icon || '💰'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-foreground/90">{acc.name}</p>
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                            Số dư: <span className="tabular-nums">{balanceNum.toLocaleString('vi-VN')}₫</span>
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bước 2: Chọn tài khoản nhận (Nhóm) */}
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                2. Chọn tài khoản quỹ nhóm nhận
              </Label>
              {isLoadingGroup ? (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                  <Loader2Icon className="mr-2 size-4 animate-spin" /> Đang tải tài khoản nhóm...
                </div>
              ) : groupAccounts.length === 0 ? (
                <p className="text-sm text-amber-500 italic">Nhóm chưa có tài khoản quỹ nào.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {groupAccounts.map((acc) => {
                    const isSelected = groupAccountId === acc.id;
                    const balanceNum = Number(acc.balance) || 0;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setGroupAccountId(acc.id)}
                        disabled={isSubmitting}
                        className={cn(
                          'relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all outline-hidden cursor-pointer select-none',
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20'
                            : 'border-border bg-card hover:bg-muted/40',
                          isSubmitting && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div
                          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-xl border"
                          style={{
                            backgroundColor: `${acc.color}15`,
                            borderColor: `${acc.color}35`,
                          }}
                        >
                          {acc.icon || '💰'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-foreground/90">{acc.name}</p>
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                            Số dư: <span className="tabular-nums">{balanceNum.toLocaleString('vi-VN')}₫</span>
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bước 3: Số tiền & Ghi chú */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="contribution-amount" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  3. Số tiền đóng góp
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    ₫
                  </span>
                  <Input
                    id="contribution-amount"
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                    className="h-12 rounded-2xl pl-8 transition-all duration-200 text-base font-bold tabular-nums"
                    disabled={isSubmitting}
                    placeholder="0"
                    required
                  />
                </div>
                {rawAmount > 0 && (
                  <p className="text-xs text-muted-foreground italic font-medium">
                    Sẽ ghi giảm {rawAmount.toLocaleString('vi-VN')}₫ ở tài khoản cá nhân và tăng {rawAmount.toLocaleString('vi-VN')}₫ ở quỹ nhóm.
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contribution-note" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Ghi chú giao dịch
                </Label>
                <Input
                  id="contribution-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nộp quỹ nhóm..."
                  className="h-11 rounded-2xl"
                  disabled={isSubmitting}
                />
              </div>
            </div>

          </div>

          {/* Footer controls */}
          <div className="border-t px-5 py-4 sm:px-6 bg-muted/10 shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="rounded-2xl font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isSubmitting || rawAmount <= 0 || !personalAccountId || !groupAccountId}
              >
                {isSubmitting && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                Xác nhận nộp quỹ
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
