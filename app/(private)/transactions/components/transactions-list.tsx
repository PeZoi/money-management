'use client';

import { m } from 'framer-motion';
import {
  ArrowDownCircleIcon,
  ArrowRightLeftIcon,
  ArrowUpCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  PlusIcon,
  ReceiptTextIcon,
  Trash2Icon,
  RefreshCwIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import IconPreview from '@/components/icons/icon-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaceStore } from '@/hooks/use-workspace';
import { useTransactionMutation } from '@/hooks/use-transactions';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { cn } from '@/lib/utils';
import type { TransactionWithCategory } from '@/types/database';

import { formatVnd, typeAmountClass, typeAmountPrefix, typeBadgeClass, typeLabel } from '../transaction-ui';
import { staggerContainer, fadeSlideUp } from '@/lib/motion-variants';

type Props = {
  transactions: TransactionWithCategory[];
  isLoading: boolean;
  onRequestCreate: () => void;
  onRequestDelete: (id: string) => void;
  onRequestUpdate: (transaction: TransactionWithCategory) => void;
};

// Định dạng ngày giờ chi tiết: HH:mm - dd/MM/yyyy (Chuyển lên global scope để dùng chung)
const formatTime = (iso: string) => {
  try {
    const d = new Date(iso);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  } catch {
    return '';
  }
};

// Component hàng giao dịch hỗ trợ kéo thả vuốt trái (Swipe to Delete)
function TransactionRow({
  t,
  isSubmitting,
  onRequestUpdate,
  onRequestDelete,
  isGroupWorkspace,
}: {
  t: TransactionWithCategory;
  isSubmitting: boolean;
  onRequestUpdate: (t: TransactionWithCategory) => void;
  onRequestDelete: (id: string) => void;
  isGroupWorkspace: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const deleteBtnRef = useRef<HTMLButtonElement>(null);
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
    if (deleteBtnRef.current) {
      deleteBtnRef.current.style.transition = 'none';
      deleteBtnRef.current.style.visibility = 'visible';
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
      rowRef.current.style.transform = `translate3d(${targetX}px, 0, 0)`;
    }

    // Điều chỉnh độ mờ (opacity) của nút xóa tỉ lệ với khoảng cách kéo
    if (deleteBtnRef.current) {
      const opacity = Math.min(1, Math.abs(targetX) / 80);
      deleteBtnRef.current.style.opacity = String(opacity);
    }
  };

  // Thả tay
  const handleTouchEnd = () => {
    isDragging.current = false;

    if (rowRef.current) {
      rowRef.current.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
    }
    if (deleteBtnRef.current) {
      deleteBtnRef.current.style.transition = 'opacity 0.25s ease, visibility 0.25s ease';
    }

    // Nếu vuốt qua trái hơn nửa chặng đường (-40px) thì mở hoàn toàn nút xóa (-80px)
    if (currentX.current < -40) {
      if (rowRef.current) rowRef.current.style.transform = 'translate3d(-80px, 0, 0)';
      isOpen.current = true;
      currentX.current = -80;
      if (deleteBtnRef.current) {
        deleteBtnRef.current.style.opacity = '1';
        deleteBtnRef.current.style.visibility = 'visible';
      }
    } else {
      if (rowRef.current) rowRef.current.style.transform = 'translate3d(0px, 0, 0)';
      isOpen.current = false;
      currentX.current = 0;
      if (deleteBtnRef.current) {
        deleteBtnRef.current.style.opacity = '0';
        deleteBtnRef.current.style.visibility = 'hidden';
      }
    }
  };

  // Tự động đóng lại khi người dùng nhấp ra ngoài khu vực hàng đang mở
  useEffect(() => {
    const handleGlobalClick = () => {
      if (isOpen.current) {
        if (rowRef.current) {
          rowRef.current.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
          rowRef.current.style.transform = 'translate3d(0px, 0, 0)';
        }
        if (deleteBtnRef.current) {
          deleteBtnRef.current.style.transition = 'opacity 0.2s ease, visibility 0.2s ease';
          deleteBtnRef.current.style.opacity = '0';
          deleteBtnRef.current.style.visibility = 'hidden';
        }
        isOpen.current = false;
        currentX.current = 0;
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const isIncome = t.type === 'income';
  const isTransfer = t.type === 'transfer';
  const AmountIcon = isTransfer ? ArrowRightLeftIcon : isIncome ? ArrowUpCircleIcon : ArrowDownCircleIcon;
  const amountIconClass = isTransfer ? 'text-blue-500' : isIncome ? 'text-emerald-500' : 'text-rose-500';
  const iconBgClass = isTransfer
    ? 'bg-blue-500/10 border-blue-500/20'
    : isIncome
      ? 'bg-emerald-500/10 border-emerald-500/20'
      : 'bg-rose-500/10 border-rose-500/20';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/50 bg-gray-200 dark:bg-muted/20 shadow-xs transition-colors duration-300',
        isTransfer ? 'hover:border-blue-500/35' : isIncome ? 'hover:border-emerald-500/35' : 'hover:border-rose-500/35',
      )}
    >
      {/* Nút Xoá nằm chìm bên dưới (Chỉ hiển thị trên mobile, mặc định ẩn để tránh lộ viền) */}
      <button
        ref={deleteBtnRef}
        type="button"
        disabled={isSubmitting}
        onClick={(e) => {
          e.stopPropagation();
          onRequestDelete(t.id);
        }}
        className="absolute right-0 top-0 bottom-0 z-0 flex w-20 items-center justify-center bg-linear-to-l from-rose-600 to-rose-500 rounded-r-2xl font-semibold text-white shadow-inner active:opacity-90 md:hidden opacity-0 invisible transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed"
      >
        <div className="flex flex-col items-center gap-1.5 transition-transform duration-200 active:scale-95">
          {isSubmitting ? (
            <RefreshCwIcon className="size-5 animate-spin" />
          ) : (
            <Trash2Icon className="size-5" />
          )}
          <span className="text-[10px] font-semibold tracking-wide">{isSubmitting ? 'Đang xóa...' : 'Xóa'}</span>
        </div>
      </button>

      {/* Panel nội dung chính nằm phía trên */}
      <div
        ref={rowRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (isOpen.current) {
            e.stopPropagation();
            rowRef.current!.style.transition = 'transform 0.2s ease';
            rowRef.current!.style.transform = 'translate3d(0px, 0, 0)';
            if (deleteBtnRef.current) {
              deleteBtnRef.current.style.transition = 'opacity 0.2s ease, visibility 0.2s ease';
              deleteBtnRef.current.style.opacity = '0';
              deleteBtnRef.current.style.visibility = 'hidden';
            }
            isOpen.current = false;
            currentX.current = 0;
            return;
          }
          onRequestUpdate(t);
        }}
        className={cn(
          'group relative z-10 flex cursor-pointer items-center gap-4 bg-card p-4 transition-all duration-300 select-none',
          isTransfer
            ? 'hover:bg-blue-50/70 dark:hover:bg-blue-950/30'
            : isIncome
              ? 'hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30'
              : 'hover:bg-rose-50/70 dark:hover:bg-rose-950/30',
        )}
      >
        {/* Icon mờ nghệ thuật (watermark) lớn ở góc dưới bên phải */}
        <div className="absolute -right-6 -bottom-6 pointer-events-none select-none opacity-[0.04] dark:opacity-[0.02] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
          {t.category?.icon ? (
            <IconPreview name={t.category.icon} className={cn('size-28', amountIconClass)} />
          ) : (
            <span className="inline-flex items-center justify-center text-8xl select-none leading-none font-normal">
              {t.type === 'transfer' ? '🔄' : '🏷️'}
            </span>
          )}
        </div>

        {/* Bọc chứa Category Icon bo góc mềm mại & sub-badge thu/chi */}
        <div
          className={cn(
            'relative flex size-12 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-105',
            iconBgClass,
          )}
        >
          {t.category?.icon ? (
            <IconPreview name={t.category.icon} className={cn('size-5.5', amountIconClass)} />
          ) : (
            <span className="inline-flex items-center justify-center text-[1.375rem] select-none leading-none font-normal -translate-y-px">
              {t.type === 'transfer' ? '🔄' : '🏷️'}
            </span>
          )}
          {/* Badge phụ góc dưới bên phải thể hiện thu/chi */}
          <span
            className={cn(
              'absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border bg-background shadow-xs text-[10px]',
              isIncome
                ? 'border-emerald-500/20 text-emerald-500'
                : isTransfer
                  ? 'border-blue-500/20 text-blue-500'
                  : 'border-rose-500/20 text-rose-500',
            )}
          >
            <AmountIcon className="size-3" aria-hidden />
          </span>
        </div>

        {/* Info phân cấp rõ ràng (Note > Category > Date) */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="truncate font-semibold text-sm leading-tight text-foreground transition-colors ">
              {t.note || (t.category?.name ?? 'Khác')}
            </h4>
            <Badge
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[10px] font-medium border leading-none shrink-0',
                typeBadgeClass(t.type),
              )}
            >
              {typeLabel(t.type)}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {t.note && (
              <>
                <span className="font-medium text-foreground/75 truncate max-w-[120px]">
                  {t.category?.name ?? 'Khác'}
                </span>
                <span className="text-muted-foreground/40 font-light select-none">·</span>
              </>
            )}
            {t.account && (
              <>
                <span className="inline-flex items-center gap-1 font-medium text-foreground/75">
                  <span className="text-[11px] leading-none select-none">{t.account.icon}</span>
                  <span>{t.account.name}</span>
                </span>
                {/* Hiển thị mũi tên chuyển tiền nếu là transfer */}
                {isTransfer && (
                  <>
                    <span className="text-blue-500 font-medium select-none">→</span>
                    <span className="inline-flex items-center gap-1 font-medium text-foreground/75">
                      {t.to_account ? (
                        <>
                          <span className="text-[11px] leading-none select-none">{t.to_account.icon}</span>
                          <span>{t.to_account.name}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">Tiền mặt</span>
                      )}
                    </span>
                  </>
                )}
                <span className="text-muted-foreground/40 font-light select-none">·</span>
              </>
            )}
            <div className="flex items-center gap-1">
              <ClockIcon className="size-3 shrink-0 opacity-70" aria-hidden />
              <span>{formatTime(t.created_at)}</span>
            </div>
            {isGroupWorkspace && t.created_by_details?.display_name && (
              <>
                <span className="text-muted-foreground/40 font-light select-none">·</span>
                <span className="inline-flex items-center gap-0.5 text-muted-foreground/80" title={t.created_by_details.email}>
                  <span>Tạo bởi: <strong className="font-semibold text-foreground/75">{t.created_by_details.display_name}</strong></span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Số tiền & Nút xóa slide-in ngang tinh tế */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p
              className={cn('text-base font-bold tracking-tight transition-all duration-300', typeAmountClass(t.type))}
            >
              {typeAmountPrefix(t.type)}
              {formatVnd(t.amount)}
            </p>
          </div>

          {/* Nút xóa slide-in thông minh (Chỉ hiện khi hover trên máy tính bàn) */}
          <div className="hidden md:flex items-center justify-center w-0 opacity-0 overflow-hidden transition-all duration-300 group-hover:w-8 group-hover:opacity-100">
            <button
              type="button"
              aria-label="Xóa giao dịch"
              disabled={isSubmitting}
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete(t.id);
              }}
              className={cn(
                'inline-flex size-8 items-center justify-center rounded-xl border border-border bg-background shadow-xs text-muted-foreground',
                'transition-all duration-200 hover:scale-105 active:scale-95',
                'hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:bg-rose-500/20',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {isSubmitting ? (
                <RefreshCwIcon className="size-4 animate-spin text-rose-500" />
              ) : (
                <Trash2Icon className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card/60 p-4">
      <Skeleton className="size-11 shrink-0 rounded-xl" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export default function TransactionsList({
  transactions,
  isLoading,
  onRequestCreate,
  onRequestDelete,
  onRequestUpdate,
}: Props) {
  const { activeWorkspaceId } = useWorkspaceStore();
  const { data: workspaces = [] } = useWorkspaces();
  const { isSubmitting } = useTransactionMutation();

  // Xác định xem workspace đang hoạt động có phải là nhóm hay không
  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const isGroupWorkspace = currentWorkspace ? !currentWorkspace.is_personal : false;

  // Trạng thái đóng/mở của mỗi nhóm ngày giao dịch
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-muted/30">
          <ReceiptTextIcon className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <h2 className="mt-4 text-base font-semibold">Chưa có giao dịch nào</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hãy ghi nhận giao dịch đầu tiên để theo dõi thu &amp; chi của bạn.
        </p>
        <Button type="button" className="mt-6 rounded-xl" onClick={onRequestCreate}>
          <PlusIcon className="mr-2 size-4" aria-hidden />
          Thêm giao dịch
        </Button>
      </div>
    );
  }

  // Gom nhóm giao dịch theo ngày cục bộ để đảm bảo chính xác múi giờ của người dùng
  const groupedTransactions = transactions.reduce<{ title: string; items: TransactionWithCategory[] }[]>((acc, t) => {
    const date = new Date(t.created_at);
    const dayOfWeek = date.getDay();
    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayLabel = dayNames[dayOfWeek];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const title = `${dayLabel}, ${day}/${month}`;

    const existingGroup = acc.find((g) => g.title === title);
    if (existingGroup) {
      existingGroup.items.push(t);
    } else {
      acc.push({ title, items: [t] });
    }
    return acc;
  }, []);

  return (
    <m.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
    >
      {groupedTransactions.map((group) => {
        const isCollapsed = collapsedGroups[group.title];

        // Tính tổng net của ngày: income - expense (bỏ transfer vì không ảnh hưởng số dư ròng)
        const dayIncome = group.items.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const dayExpense = group.items.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
        const dayNet = dayIncome - dayExpense;
        const hasOnlyTransfer = dayIncome === 0 && dayExpense === 0;

        return (
          <m.div key={group.title} className="space-y-3" variants={fadeSlideUp}>
            {/* Tiêu đề Section (Ngày giao dịch) được thiết kế thành nút bấm đóng/mở thông minh */}
            <button
              type="button"
              onClick={() => toggleGroup(group.title)}
              className="flex w-full items-center gap-3 px-1 py-1 text-left select-none group/header hover:opacity-85 transition-opacity cursor-pointer"
            >
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-colors group-hover/header:text-foreground">
                {group.title}
              </span>
              <ChevronDownIcon
                className={cn(
                  'size-3.5 text-muted-foreground/60 transition-transform duration-300 group-hover/header:text-foreground',
                  isCollapsed && '-rotate-90 text-muted-foreground/40',
                )}
              />
              <div className="h-px flex-1 bg-border/40" />
              <span className="text-[11px] font-medium text-muted-foreground/60">{group.items.length} giao dịch</span>
              {/* Tổng tiền net của ngày */}
              {!hasOnlyTransfer && (
                <span
                  className={cn(
                    'text-[11px] font-semibold tabular-nums',
                    dayNet > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : dayNet < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-muted-foreground/60',
                  )}
                >
                  {dayNet > 0 ? '+' : ''}
                  {formatVnd(dayNet)}
                </span>
              )}
            </button>

            {!isCollapsed && (
              <div className="flex flex-col gap-2">
                {group.items.map((t) => (
                  <TransactionRow
                    key={t.id}
                    t={t}
                    isSubmitting={isSubmitting}
                    onRequestUpdate={onRequestUpdate}
                    onRequestDelete={onRequestDelete}
                    isGroupWorkspace={isGroupWorkspace}
                  />
                ))}
              </div>
            )}
          </m.div>
        );
      })}
    </m.div>
  );
}
