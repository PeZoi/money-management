'use client';

import type { AccountRow } from '@/types/database';
import { useAccountMutation } from '@/hooks/use-accounts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  CheckCircle2Icon,
  EditIcon,
  MoreVerticalIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Tiền mặt',
  bank: 'Ngân hàng',
  e_wallet: 'Ví điện tử',
  investment: 'Đầu tư',
  other: 'Khác',
};

type AccountsListProps = {
  accounts: AccountRow[];
  isLoading: boolean;
  onRequestCreate: () => void;
  onRequestEdit: (account: AccountRow) => void;
  onRequestDelete: (id: string) => void;
  onRequestActivate: (id: string) => void;
};

export default function AccountsList({
  accounts,
  isLoading,
  onRequestCreate,
  onRequestEdit,
  onRequestDelete,
  onRequestActivate,
}: AccountsListProps) {
  const { isSubmitting } = useAccountMutation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border bg-card text-4xl shadow-sm">
          💳
        </div>
        <h3 className="mb-1 text-lg font-semibold">Chưa có tài khoản nào</h3>
        <p className="mb-6 max-w-xs text-sm text-muted-foreground">
          Thêm tài khoản để bắt đầu theo dõi thu chi theo từng ví, ngân hàng hoặc ví điện tử.
        </p>
        <Button type="button" className="rounded-xl" onClick={onRequestCreate}>
          <PlusIcon className="mr-2 size-4" aria-hidden />
          Thêm tài khoản đầu tiên
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          isSubmitting={isSubmitting}
          onEdit={() => onRequestEdit(account)}
          onDelete={() => onRequestDelete(account.id)}
          onActivate={() => onRequestActivate(account.id)}
        />
      ))}
    </div>
  );
}

type AccountCardProps = {
  account: AccountRow;
  isSubmitting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onActivate: () => void;
};

function AccountCard({ account, isSubmitting, onEdit, onDelete, onActivate }: AccountCardProps) {
  const balance = Number(account.balance);
  const isNegative = balance < 0;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        account.is_active && 'ring-2 ring-primary/50 border-primary/30'
      )}
      style={{ borderColor: account.is_active ? undefined : `${account.color}30` }}
    >
      {/* Accent gradient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{ background: `linear-gradient(135deg, ${account.color}, transparent 60%)` }}
        aria-hidden
      />

      {/* Active badge */}
      {account.is_active && (
        <div className="absolute right-3 top-3 z-10">
          <Badge className="gap-1 rounded-xl bg-primary/15 px-2 py-0.5 text-primary text-[10px] font-semibold border-primary/20">
            <CheckCircle2Icon className="size-3" />
            Active
          </Badge>
        </div>
      )}

      {/* Menu */}
      <div className="absolute left-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="size-7 rounded-lg border-muted-foreground/20 bg-background/80 backdrop-blur-sm shadow-sm"
              disabled={isSubmitting}
            >
              <MoreVerticalIcon className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-44 rounded-xl">
            {!account.is_active && (
              <DropdownMenuItem onClick={onActivate} className="rounded-lg cursor-pointer gap-2">
                <CheckCircle2Icon className="size-4 text-primary" />
                <span>Đặt làm active</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onEdit} className="rounded-lg cursor-pointer gap-2">
              <EditIcon className="size-4" />
              <span>Chỉnh sửa</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="rounded-lg cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2Icon className="size-4" />
              <span>Xóa tài khoản</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Card content */}
      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl border shadow-sm"
            style={{ backgroundColor: `${account.color}18`, borderColor: `${account.color}30` }}
          >
            {account.icon}
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <p className="truncate font-semibold text-base leading-tight">{account.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {ACCOUNT_TYPE_LABELS[account.type] ?? account.type} · {account.currency}
            </p>
          </div>
        </div>

        {/* Balance */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-0.5">
              Số dư
            </p>
            <p
              className={cn(
                'text-xl font-bold tabular-nums tracking-tight',
                isNegative ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {isNegative ? '-' : '+'}
              {Math.abs(balance).toLocaleString('vi-VN')}₫
            </p>
          </div>

          {/* Quick activate button if not active */}
          {!account.is_active && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-xl text-xs border-muted-foreground/20 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all"
              onClick={onActivate}
              disabled={isSubmitting}
            >
              Chọn
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
