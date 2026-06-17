'use client';

import { m } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AccountRow } from '@/types/database';
import { useAccountMutation } from '@/hooks/use-accounts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CheckCircle2Icon, EditIcon, MoreVerticalIcon, PlusIcon, Trash2Icon, RefreshCwIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { staggerContainer, fadeSlideUp } from '@/lib/motion-variants';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Tiền mặt',
  bank: 'Ngân hàng',
  e_wallet: 'Ví điện tử',
  savings: 'Tiết kiệm',
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
    <m.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
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
    </m.div>
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
  const router = useRouter();
  const [isActivating, setIsActivating] = useState(false);
  const balance = Number(account.balance);
  const isNegative = balance < 0;

  const rowRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef({ x: 0, y: 0 });
  const currentX = useRef(0);
  const isOpen = useRef(false);
  const isDragging = useRef(false);

  // Bắt đầu chạm
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    isDragging.current = true;

    // Tắt transition để khi vuốt ngón tay phản hồi ngay lập tức không bị trễ
    if (rowRef.current) {
      rowRef.current.style.transition = 'none';
    }
  };

  // Kéo di chuyển
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStart.current.x;
    const diffY = touch.clientY - touchStart.current.y;

    // Nếu người dùng cuộn dọc nhiều hơn kéo ngang thì bỏ qua
    if (Math.abs(diffY) > Math.abs(diffX)) {
      return;
    }

    // Khoảng cách dịch chuyển thực tế
    let targetX = isOpen.current ? diffX - 80 : diffX;

    // Tạo hiệu ứng đàn hồi giảm lực cản (Elastic effect)
    if (targetX < -80) {
      targetX = -80 + (targetX + 80) * 0.35;
    }
    if (targetX > 0) {
      targetX = targetX * 0.25;
    }

    currentX.current = targetX;
    if (rowRef.current) {
      rowRef.current.style.transform = `translateX(${targetX}px)`;
    }
  };

  // Thả tay
  const handleTouchEnd = () => {
    isDragging.current = false;
    if (rowRef.current) {
      rowRef.current.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';

      // Nếu vuốt qua trái hơn nửa chặng đường (-40px) thì mở hoàn toàn nút xóa (-80px)
      if (currentX.current < -40) {
        rowRef.current.style.transform = 'translateX(-80px)';
        isOpen.current = true;
        currentX.current = -80;
      } else {
        rowRef.current.style.transform = 'translateX(0px)';
        isOpen.current = false;
        currentX.current = 0;
      }
    }
  };

  // Tự động đóng lại khi người dùng nhấp ra ngoài khu vực hàng đang mở
  useEffect(() => {
    const handleGlobalClick = () => {
      if (isOpen.current && rowRef.current) {
        rowRef.current.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        rowRef.current.style.transform = 'translateX(0px)';
        isOpen.current = false;
        currentX.current = 0;
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <m.div
      variants={fadeSlideUp}
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-gray-200 dark:bg-muted/10 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        account.is_active && 'ring-2 ring-primary/50 border-primary/30',
      )}
      style={{ borderColor: account.is_active ? undefined : `${account.color}30` }}
    >
      {/* Nút Xoá nằm chìm bên dưới (Chỉ hiển thị trên mobile) */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-0 top-0 bottom-0 z-0 flex w-20 items-center justify-center bg-rose-500 font-semibold text-white transition-colors hover:bg-rose-600 active:bg-rose-700 md:hidden disabled:opacity-75 disabled:cursor-not-allowed"
      >
        <div className="flex flex-col items-center gap-1">
          {isSubmitting ? (
            <RefreshCwIcon className="size-5 animate-spin" />
          ) : (
            <Trash2Icon className="size-5" />
          )}
          <span className="text-[10px] font-medium">{isSubmitting ? 'Đang xóa...' : 'Xóa'}</span>
        </div>
      </button>

      {/* Panel nội dung chính nằm phía trên, click để chỉnh sửa */}
      <div
        ref={rowRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (isOpen.current) {
            e.stopPropagation();
            rowRef.current!.style.transition = 'transform 0.2s ease';
            rowRef.current!.style.transform = 'translateX(0px)';
            isOpen.current = false;
            currentX.current = 0;
            return;
          }
          router.push(`/accounts/${account.id}`);
        }}
        className="group relative z-10 flex cursor-pointer flex-col bg-card p-4 transition-all duration-300 select-none"
      >
        {/* Accent gradient */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ background: `linear-gradient(135deg, ${account.color}, transparent 60%)` }}
          aria-hidden
        />

        {/* Icon mờ nghệ thuật (watermark) lớn ở góc dưới bên phải */}
        <div className="absolute -right-3 -bottom-5 pointer-events-none select-none opacity-[0.08] dark:opacity-[0.05] text-8xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
          {account.icon}
        </div>

        {/* Active badge */}
        {account.is_active && (
          <div className="absolute right-3 top-3 z-10">
            <Badge className="gap-1 rounded-xl bg-primary/15 px-2 py-0.5 text-primary text-[10px] font-semibold border-primary/20">
              <CheckCircle2Icon className="size-3" />
              Active
            </Badge>
          </div>
        )}

        {/* Menu (Chỉ hiển thị hover trên desktop) */}
        <div className="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-7 rounded-lg border-muted-foreground/20 bg-background/80 backdrop-blur-sm shadow-sm"
                disabled={isSubmitting}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVerticalIcon className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-44 rounded-xl">
              {!account.is_active && (
                <DropdownMenuItem
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (isActivating) return;
                    setIsActivating(true);
                    try {
                      await onActivate();
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setIsActivating(false);
                    }
                  }}
                  className="rounded-lg cursor-pointer gap-2"
                  disabled={isSubmitting || isActivating}
                >
                  {isActivating ? (
                    <RefreshCwIcon className="size-4 animate-spin text-primary" />
                  ) : (
                    <CheckCircle2Icon className="size-4 text-primary" />
                  )}
                  <span>Đặt làm active</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="rounded-lg cursor-pointer gap-2"
              >
                <EditIcon className="size-4" />
                <span>Chỉnh sửa</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                disabled={isSubmitting}
                className="rounded-lg cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <RefreshCwIcon className="size-4 animate-spin text-destructive" />
                ) : (
                  <Trash2Icon className="size-4" />
                )}
                <span>{isSubmitting ? 'Đang xóa...' : 'Xóa tài khoản'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Card content */}
        <div className="relative p-4 pb-0 pl-0 pr-0 pt-0">
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
              <p className="mt-0.5 text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
                <span>{ACCOUNT_TYPE_LABELS[account.type] ?? account.type} · {account.currency}</span>
                {!account.is_system && (
                  <Badge variant="outline" className="rounded-md px-1.5 py-0 border-muted-foreground/30 bg-muted/30 text-muted-foreground text-[9px] font-medium leading-none h-4">
                    Ngoài hệ thống
                  </Badge>
                )}
              </p>
            </div>
          </div>

          {/* Balance */}
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-0.5">Số dư</p>
              <p
                className={cn(
                  'text-xl font-bold tabular-nums tracking-tight',
                  isNegative ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400',
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
                className="h-8 rounded-xl text-xs border-muted-foreground/20 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all gap-1.5"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (isActivating) return;
                  setIsActivating(true);
                  try {
                    await onActivate();
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsActivating(false);
                  }
                }}
                disabled={isSubmitting || isActivating}
              >
                {isActivating ? (
                  <RefreshCwIcon className="size-3.5 animate-spin text-muted-foreground" />
                ) : (
                  'Kích hoạt'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </m.div>
  );
}
