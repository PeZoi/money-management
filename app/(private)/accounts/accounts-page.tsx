'use client';

import { useState } from 'react';
import { PrivatePageShell } from '@/components/private-page-shell';
import { Button } from '@/components/ui/button';
import { useDraggable } from '@/hooks/use-draggable';
import { useWorkspaceStore } from '@/hooks/use-workspace';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { cn } from '@/lib/utils';
import { CreditCardIcon, PlusIcon, CoinsIcon } from 'lucide-react';
import AccountFormDialog from './components/account-form-dialog';
import FundContributionDialog from './components/fund-contribution-dialog';
import AccountsList from './components/accounts-list';
import { useAccountsPage } from './hooks/use-accounts-page';
import type { AccountRow } from '@/types/database';

export default function AccountsPage() {
  const {
    accounts,
    activeAccount,
    isLoading,
    fetchAccounts,
    createOpen,
    setCreateOpen,
    editingAccount,
    setEditingAccount,
    handleDelete,
    handleActivate,
    totalBalance,
  } = useAccountsPage();

  const { activeWorkspaceId } = useWorkspaceStore();
  const { data: workspaces = [] } = useWorkspaces();
  const [contributionOpen, setContributionOpen] = useState(false);

  // Xác định xem workspace hiện tại có phải workspace nhóm (không phải cá nhân) hay không
  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const isGroupWorkspace = currentWorkspace && !currentWorkspace.is_personal;

  // Hook kéo thả FAB mượt mà trên di động
  const { ref: fabRef, dragInfo, handleDragStart } = useDraggable();

  // Mô tả phụ tĩnh cho thẻ "Số tài khoản"
  const accountsSummaryText = 'Nguồn tiền đang được quản lý';

  return (
    <>
      <PrivatePageShell
        title="Tài khoản"
        description="Quản lý ví, ngân hàng & ví điện tử — chọn tài khoản active để ghi giao dịch."
        icon={CreditCardIcon}
        headerActions={
          <div className="hidden md:flex items-center gap-2">
            {isGroupWorkspace && (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-semibold"
                onClick={() => setContributionOpen(true)}
              >
                <CoinsIcon className="mr-2 size-4" aria-hidden />
                Nộp quỹ nhóm
              </Button>
            )}
            <Button type="button" className="rounded-xl" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="mr-2 size-4" aria-hidden />
              Thêm tài khoản
            </Button>
          </div>
        }
      >
        {/* Summary bar - Bố cục không đối xứng sáng tạo: Tổng tài sản chiếm full width trên mobile, 2 thẻ phụ nằm ngang ở dưới */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 slide-in-from-top-2 duration-300">
          <SummaryCard
            label="Tổng tài sản"
            value={totalBalance}
            sublabel="Tích lũy từ tất cả các ví & tài khoản"
            color="text-foreground"
            icon="🏦"
            className="col-span-2 sm:col-span-1"
            isMain={true}
          />
          <SummaryCard
            label="Tài khoản active"
            value={activeAccount ? Number(activeAccount.balance) : null}
            sublabel={activeAccount?.name ?? 'Chưa chọn'}
            icon={activeAccount?.icon ?? '💳'}
            className="col-span-1"
            color={
              activeAccount
                ? Number(activeAccount.balance) >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-500'
                : 'text-muted-foreground'
            }
            account={activeAccount}
          />
          <SummaryCard
            label="Số tài khoản"
            valueLabel={`${accounts.length} tài khoản`}
            sublabel={accountsSummaryText}
            icon="📊"
            className="col-span-1"
            color="text-foreground"
          />
        </div>

        {/* Đường phân cách & Tiêu đề khu vực danh sách tài khoản */}
        <div className="mt-8 flex items-center justify-between border-t border-border/30 pt-6 pb-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-0.5">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
              Danh sách tài khoản
            </h3>
            <p className="text-xs text-muted-foreground/60 hidden sm:block">
              Nhấp vào thẻ tài khoản bên dưới để chỉnh sửa hoặc thiết lập kích hoạt
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isGroupWorkspace && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="md:hidden rounded-xl text-xs font-bold border-primary/20 bg-primary/5 text-primary py-1 h-8 px-3"
                onClick={() => setContributionOpen(true)}
              >
                <CoinsIcon className="mr-1.5 size-3.5" aria-hidden />
                Nộp quỹ
              </Button>
            )}
            <div className="text-xs font-semibold text-muted-foreground/80 bg-muted/50 dark:bg-muted/20 px-2.5 py-1.5 rounded-xl border border-border/50">
              Tổng số: <span className="font-bold text-foreground">{accounts.length}</span>
            </div>
          </div>
        </div>

        {/* Accounts grid */}
        <div className="mt-3">
          <AccountsList
            accounts={accounts}
            isLoading={isLoading}
            onRequestCreate={() => setCreateOpen(true)}
            onRequestEdit={(acc) => setEditingAccount(acc)}
            onRequestDelete={handleDelete}
            onRequestActivate={handleActivate}
          />
        </div>
      </PrivatePageShell>

      {/* Floating Action Button (FAB) trên di động - Có thể kéo thả (Draggable) */}
      <button
        ref={fabRef}
        type="button"
        onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          handleDragStart(touch.clientX, touch.clientY);
        }}
        onClick={(e) => {
          // Chỉ mở dialog nếu người dùng click thực sự, không phải thả ra sau khi kéo
          if (dragInfo.current.hasMoved) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          setCreateOpen(true);
        }}
        className="fixed bottom-24 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 md:hidden border border-primary/10 hover:bg-primary/95 touch-none select-none transition-transform active:scale-95"
        aria-label="Thêm tài khoản"
      >
        <PlusIcon className="size-6 pointer-events-none" />
      </button>

      {/* Dialog tạo mới */}
      <AccountFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          fetchAccounts();
          setCreateOpen(false);
        }}
      />

      {/* Dialog sửa — key buộc remount khi đổi tài khoản, đảm bảo form reset đúng */}
      <AccountFormDialog
        key={editingAccount?.id ?? 'edit-closed'}
        open={!!editingAccount}
        onOpenChange={(open) => {
          if (!open) setEditingAccount(null);
        }}
        account={editingAccount}
        onSuccess={() => {
          fetchAccounts();
          setEditingAccount(null);
        }}
      />

      {/* Dialog nộp quỹ nhóm */}
      <FundContributionDialog
        open={contributionOpen}
        onOpenChange={setContributionOpen}
        onSuccess={() => {
          fetchAccounts();
        }}
      />
    </>
  );
}

// ── Summary card nhỏ ─────────────────────────────────────────────────────────
type SummaryCardProps = {
  label: string;
  value?: number | null;
  valueLabel?: string;
  sublabel?: string;
  color?: string;
  icon?: string;
  className?: string;
  isMain?: boolean;
  account?: AccountRow | null;
};

function SummaryCard({
  label,
  value,
  valueLabel,
  sublabel,
  color = 'text-foreground',
  icon,
  className,
  isMain = false,
  account,
}: SummaryCardProps) {
  if (account) {
    const balance = Number(account.balance);

    // 1. Giao diện Thẻ ngân hàng & Ví điện tử
    if (account.type === 'bank' || account.type === 'e_wallet') {
      const cardColor = account.color || '#6366f1';
      return (
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl p-3 sm:p-4 text-white transition-all duration-300 hover:scale-[1.01] select-none h-full min-h-[110px] sm:min-h-[120px] flex flex-col justify-between',
            className,
          )}
          style={{
            background: `linear-gradient(135deg, ${cardColor} 0%, rgba(15, 23, 42, 0.94) 100%)`,
            borderColor: `${cardColor}40`,
            boxShadow: `inset 0 1.5px 0 0 rgba(255, 255, 255, 0.15), 0 8px 24px -4px rgba(0, 0, 0, 0.16)`,
          }}
        >
          {/* Hiệu ứng phản quang & chiều sâu */}
          <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
          <div className="absolute -right-8 -bottom-8 size-24 rounded-full bg-white/5 blur-lg pointer-events-none" />
          <div className="absolute -left-8 -top-8 size-20 rounded-full bg-white/10 blur-lg pointer-events-none" />

          {/* Header: Label & Chip & Chấm Active */}
          <div className="flex items-center justify-between gap-1 relative z-10">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-white/85 uppercase truncate">
                {account.type === 'bank' ? 'THẺ NGÂN HÀNG' : 'VÍ ĐIỆN TỬ'}
              </span>
              {/* Chấm tròn báo Active nhỏ gọn, phát sáng động */}
              <span className="relative flex size-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
              </span>
            </div>
            
            {/* Chip đồng giả lập */}
            <div className="relative flex h-4 w-6 sm:h-5 sm:w-7 shrink-0 items-center justify-center rounded-sm bg-linear-to-br from-amber-300 via-yellow-400 to-amber-500 border border-amber-200/50 shadow-xs">
              <div className="absolute inset-x-0 top-1/2 h-[0.5px] bg-amber-700/30" />
              <div className="absolute inset-y-0 left-1/2 w-[0.5px] bg-amber-700/30" />
              <div className="absolute top-0.5 bottom-0.5 left-1 right-1 border-[0.5px] border-amber-700/20 rounded-xs" />
            </div>
          </div>

          {/* Body: Số dư khả dụng */}
          <div className="my-1 relative z-10">
            <span className="text-[8px] sm:text-[9px] text-white/60 font-semibold tracking-wider block">SỐ DƯ KHẢ DỤNG</span>
            <p className="text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-white tabular-nums truncate">
              {balance < 0 ? '-' : ''}
              {Math.abs(balance).toLocaleString('vi-VN')}₫
            </p>
          </div>

          {/* Footer: Tên tài khoản & Icon */}
          <div className="flex items-end justify-between gap-1 mt-auto relative z-10">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-bold tracking-wide text-white truncate uppercase">
                {account.name}
              </p>
            </div>
            <span className="text-lg sm:text-xl shrink-0 drop-shadow-md select-none">
              {account.icon || '💳'}
            </span>
          </div>
        </div>
      );
    }

    // 2. Giao diện Thẻ tiền mặt (Cash)
    if (account.type === 'cash') {
      return (
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl p-3 sm:p-4 transition-all duration-300 border select-none h-full min-h-[110px] sm:min-h-[120px] flex flex-col justify-between',
            'bg-linear-to-br from-emerald-50 via-emerald-100/70 to-teal-50 border-emerald-500/20 text-emerald-950 dark:from-emerald-950/40 dark:to-emerald-900/60 dark:border-emerald-500/10 dark:text-emerald-50',
            'shadow-[0_8px_20px_-6px_rgba(16,185,129,0.12)] hover:scale-[1.01]',
            className,
          )}
        >
          {/* Họa tiết lượn sóng tờ tiền */}
          <div className="absolute inset-1 border border-dashed border-emerald-600/15 dark:border-emerald-400/15 rounded-xl pointer-events-none" />
          <div className="absolute right-2 top-2 text-5xl text-emerald-500/5 dark:text-emerald-400/5 pointer-events-none font-bold select-none">
            💵
          </div>

          <div className="flex flex-col h-full justify-between gap-3 relative z-10">
            {/* Header: Label & Chấm Active */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-emerald-700/85 dark:text-emerald-400/85 uppercase truncate">
                  TIỀN MẶT
                </span>
                {/* Chấm tròn báo Active nhỏ gọn, phát sáng động */}
                <span className="relative flex size-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
                </span>
              </div>
              <span className="text-lg sm:text-xl drop-shadow-xs">💵</span>
            </div>

            {/* Body */}
            <div className="my-1">
              <span className="text-[8px] sm:text-[9px] text-emerald-700/60 dark:text-emerald-400/60 font-semibold tracking-wider block">TIỀN MẶT CÓ SẴN</span>
              <p className="text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400 tabular-nums truncate">
                {balance < 0 ? '-' : ''}
                {Math.abs(balance).toLocaleString('vi-VN')}₫
              </p>
            </div>

            {/* Footer */}
            <div className="mt-auto">
              <span className="text-[8px] text-emerald-700/40 dark:text-emerald-400/40 block">TÊN VÍ TIỀN</span>
              <p className="text-[10px] sm:text-xs font-bold tracking-wide truncate uppercase">
                {account.name}
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  if (isMain) {
    // Tấm thẻ Tổng tài sản nổi bật, mang phong cách VIP
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border bg-linear-to-br from-primary/12 via-primary/5 to-card/90 p-5 shadow-[0_8px_30px_rgba(22,163,74,0.06)] dark:shadow-[0_8px_30px_rgba(34,197,94,0.04)] backdrop-blur-md transition-all border-primary/20 h-full flex flex-col justify-between',
          className,
        )}
      >
        {/* Điểm nhấn vệt sáng phát sáng nhẹ */}
        <div className="absolute -right-6 -top-6 size-24 rounded-full bg-primary/20 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 flex-1">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-background/80 text-2xl shadow-md text-primary">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
            {value !== null && value !== undefined ? (
              <p className="mt-1 text-2xl font-black tracking-tight tabular-nums text-foreground">
                {value < 0 ? '-' : ''}
                {Math.abs(value).toLocaleString('vi-VN')}₫
              </p>
            ) : (
              <p className="mt-1 text-lg font-bold text-muted-foreground italic">—</p>
            )}
          </div>
        </div>

        {sublabel && (
          <p className="mt-4 text-[10px] sm:text-xs text-muted-foreground/75 font-medium tracking-wide hidden md:block border-t border-primary/10 pt-2 z-10">
            {sublabel}
          </p>
        )}
      </div>
    );
  }

  // Bố cục dọc tinh gọn cho các thẻ phụ bên dưới giúp tiết kiệm không gian trên di động
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-card/75 p-3.5 shadow-sm backdrop-blur-sm transition-all h-full',
        className,
      )}
    >
      <div className="flex flex-col h-full justify-between gap-2">
        {/* Row 1: Nhãn & Biểu tượng */}
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{label}</span>
          <span className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-sm shadow-xs">
            {icon}
          </span>
        </div>

        {/* Row 2: Giá trị số dư (ở giữa thẻ) */}
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          {valueLabel ? (
            <p className={cn('text-base sm:text-lg font-bold tracking-tight truncate', color)}>{valueLabel}</p>
          ) : value !== null && value !== undefined ? (
            <p className={cn('text-base sm:text-lg font-bold tracking-tight tabular-nums truncate', color)}>
              {value < 0 ? '-' : ''}
              {Math.abs(value).toLocaleString('vi-VN')}₫
            </p>
          ) : (
            <p className="text-sm font-semibold text-muted-foreground italic">—</p>
          )}
        </div>

        {/* Row 3: Mô tả phụ (luôn ở dưới đáy, chỉ hiện ở desktop) */}
        {sublabel && (
          <p className="mt-auto truncate text-[10px] sm:text-xs text-muted-foreground/70 font-semibold hidden md:block border-t border-muted/20 pt-1.5">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
