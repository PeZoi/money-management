'use client';

import { PrivatePageShell } from '@/components/private-page-shell';
import { Button } from '@/components/ui/button';
import { CreditCardIcon, PlusIcon } from 'lucide-react';
import AccountFormDialog from './components/account-form-dialog';
import AccountsList from './components/accounts-list';
import { useAccountsPage } from './hooks/use-accounts-page';

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

  return (
    <>
      <PrivatePageShell
        title="Tài khoản"
        description="Quản lý ví, ngân hàng & ví điện tử — chọn tài khoản active để ghi giao dịch."
        icon={CreditCardIcon}
        headerActions={
          <Button type="button" className="rounded-xl" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="mr-2 size-4" aria-hidden />
            Thêm tài khoản
          </Button>
        }
      >
        {/* Summary bar */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <SummaryCard
            label="Tổng tài sản"
            value={totalBalance}
            color="text-foreground"
            icon="🏦"
          />
          <SummaryCard
            label="Tài khoản active"
            value={activeAccount ? Number(activeAccount.balance) : null}
            sublabel={activeAccount?.name ?? 'Chưa chọn'}
            icon={activeAccount?.icon ?? '💳'}
            color={
              activeAccount
                ? Number(activeAccount.balance) >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-500'
                : 'text-muted-foreground'
            }
          />
          <SummaryCard
            label="Số tài khoản"
            valueLabel={`${accounts.length} tài khoản`}
            icon="📊"
            color="text-foreground"
          />
        </div>

        {/* Accounts grid */}
        <div className="mt-5">
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
};

function SummaryCard({ label, value, valueLabel, sublabel, color = 'text-foreground', icon }: SummaryCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card/75 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted/50 text-xl shadow-sm">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          {valueLabel ? (
            <p className={`mt-0.5 text-lg font-bold ${color}`}>{valueLabel}</p>
          ) : value !== null && value !== undefined ? (
            <p className={`mt-0.5 text-lg font-bold tabular-nums ${color}`}>
              {value < 0 ? '-' : ''}{Math.abs(value).toLocaleString('vi-VN')}₫
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground italic">—</p>
          )}
          {sublabel && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}
