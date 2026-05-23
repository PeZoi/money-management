'use client';

import { MonthPicker } from '@/components/month-picker';
import { PrivatePageShell } from '@/components/private-page-shell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  ArrowLeftIcon,
  BarChart3Icon,
  CreditCardIcon,
  EditIcon,
  HistoryIcon,
  ReceiptTextIcon
} from 'lucide-react';

import AccountFormDialog from '@/app/(private)/accounts/components/account-form-dialog';
import TransactionsList from '@/app/(private)/transactions/components/transactions-list';
import UpdateTransactionDialog from '@/app/(private)/transactions/components/update-transaction-dialog';

// Custom subcomponents & hooks
import { useAccountDetailPage } from '@/app/(private)/accounts/hooks/use-account-detail-page';
import { AccountSummary } from './components/account-summary';
import { AnalysisTab } from './components/analysis-tab';
import { CumulativeBalanceTable } from './components/cumulative-balance-table';
import { YearPicker } from './components/year-picker';
import DayTransactionsDialog from './day-transactions-dialog';

type AccountDetailPageProps = {
  id: string;
};

export default function AccountDetailPage({ id }: AccountDetailPageProps) {
  const {
    router,
    account,
    isAccountLoading,
    isTxLoading,
    filterType,
    setFilterType,
    activeTab,
    setActiveTab,
    editOpen,
    setEditOpen,
    sortDirection,
    setSortDirection,
    month,
    setMonth,
    year,
    setYear,
    years,
    selectedBucket,
    setSelectedBucket,
    selectedTx,
    setSelectedTx,
    updateTxOpen,
    setUpdateTxOpen,
    stats,
    filteredPeriodTransactions,
    categoryStats,
    sortedStatsItems,
    handleDeleteTx,
    refetchAll,
  } = useAccountDetailPage(id);

  if (isAccountLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="mb-2 text-lg font-semibold">Không tìm thấy tài khoản</h3>
        <Button variant="outline" className="rounded-xl" onClick={() => router.push('/accounts')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <>
      <PrivatePageShell
        title={account.name}
        description="Báo cáo chi tiết luồng tiền và lịch sử giao dịch phát sinh."
        icon={CreditCardIcon}
        headerActions={
          <div className="flex items-center justify-between w-full gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/accounts')}
              className="rounded-xl h-10 text-xs font-semibold"
            >
              <ArrowLeftIcon className="mr-1.5 size-4" />
              Quay lại
            </Button>
            <Button
              type="button"
              onClick={() => setEditOpen(true)}
              className="rounded-xl h-10 text-xs font-semibold"
            >
              <EditIcon className="mr-1.5 size-4" />
              Chỉnh sửa
            </Button>
          </div>
        }
      >
        {/* HÀNG TRÊN CÙNG: Summary Cards */}
        <AccountSummary
          account={account}
          isLoading={isAccountLoading}
          totalIncome={stats.totalIncome}
          totalExpense={stats.totalExpense}
        />

        {/* KHỐI DƯỚI: Bộ lọc, Tabs và nội dung chi tiết */}
        <div className="mt-6 space-y-6">
          {/* Bộ lọc thời gian */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border bg-card/50 rounded-2xl p-4 shadow-xs">
            <div className="flex p-1 rounded-xl bg-muted/60 border gap-0.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFilterType('month')}
                className={cn(
                  'flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all',
                  filterType === 'month' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Theo tháng
              </button>
              <button
                type="button"
                onClick={() => setFilterType('year')}
                className={cn(
                  'flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all',
                  filterType === 'year' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Theo năm
              </button>
            </div>

            {/* Picker động */}
            <div className="flex items-center gap-2 justify-center sm:justify-end w-full sm:w-auto">
              {filterType === 'month' ? (
                <MonthPicker value={month} onChange={setMonth} />
              ) : (
                <YearPicker value={year} onChange={setYear} years={years} />
              )}
            </div>
          </div>

          {/* TAB SELECTOR */}
          <div className="flex w-full p-1 rounded-2xl bg-muted/60 border border-muted-foreground/10 gap-1 shadow-inner select-none">
            <button
              type="button"
              onClick={() => setActiveTab('analysis')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer active:scale-95',
                activeTab === 'analysis'
                  ? 'bg-background text-foreground shadow-md border border-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/20'
              )}
            >
              <BarChart3Icon className="size-4 text-primary" />
              <span className="hidden sm:inline">Phân tích & Biểu đồ</span>
              <span className="inline sm:hidden">Phân tích</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer active:scale-95',
                activeTab === 'details'
                  ? 'bg-background text-foreground shadow-md border border-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/20'
              )}
            >
              <HistoryIcon className="size-4 text-primary" />
              <span className="hidden sm:inline">Danh sách giao dịch</span>
              <span className="inline sm:hidden">Giao dịch</span>
            </button>
          </div>

          {/* TAB CONTENT */}
          {activeTab === 'analysis' ? (
            <AnalysisTab
              isTxLoading={isTxLoading}
              chartData={stats.chartData}
              categoryStats={categoryStats}
              filteredPeriodTransactions={filteredPeriodTransactions}
              accountId={id}
              filterType={filterType}
              year={year}
              onSelectBucket={setSelectedBucket}
            />
          ) : (
            <div className="animate-in fade-in duration-300">
              {filteredPeriodTransactions.length === 0 ? (
                <div className="rounded-2xl border bg-card/40 p-12 text-center shadow-xs">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-muted/40 text-muted-foreground">
                    <ReceiptTextIcon className="size-6" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-foreground">Không tìm thấy giao dịch nào</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
                    Tài khoản này chưa phát sinh giao dịch nào trong khoảng thời gian được lọc.
                  </p>
                </div>
              ) : (
                <TransactionsList
                  transactions={filteredPeriodTransactions}
                  isLoading={isTxLoading}
                  onRequestCreate={() => {}} // Chỉ xem và quản lý giao dịch có sẵn
                  onRequestDelete={handleDeleteTx}
                  onRequestUpdate={(t) => {
                    setSelectedTx(t);
                    setUpdateTxOpen(true);
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* BẢNG THỐNG KÊ LŨY KẾ SỐ DƯ */}
        <CumulativeBalanceTable
          isTxLoading={isTxLoading}
          initialBalance={stats.initialBalance}
          sortedStatsItems={sortedStatsItems}
          onSortDirectionChange={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
          filterType={filterType}
          year={year}
          onSelectBucket={setSelectedBucket}
        />
      </PrivatePageShell>

      {/* Dialog sửa tài khoản */}
      <AccountFormDialog
        key={account.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        account={account}
        onSuccess={refetchAll}
      />

      {/* Dialog chi tiết các giao dịch của ngày/tháng được click */}
      {selectedBucket && (
        <DayTransactionsDialog
          open={!!selectedBucket}
          onOpenChange={(open) => {
            if (!open) setSelectedBucket(null);
          }}
          title={selectedBucket.label}
          transactions={selectedBucket.transactions}
          onUpdate={(t) => {
            setSelectedTx(t);
            setUpdateTxOpen(true);
          }}
          onDelete={handleDeleteTx}
        />
      )}

      {/* Dialog sửa giao dịch */}
      <UpdateTransactionDialog
        open={updateTxOpen}
        onOpenChange={setUpdateTxOpen}
        transaction={selectedTx}
        onSuccess={refetchAll}
      />
    </>
  );
}
