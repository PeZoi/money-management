'use client';

import * as React from 'react';
import {
  LayoutDashboardIcon,
  PlusIcon
} from 'lucide-react';

import { PrivatePageShell } from '@/components/private-page-shell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Import Custom Hook
import { useDashboardPage } from './hooks/use-dashboard-page';

// Import các subcomponents
import { TimeFilterBar } from './components/time-filter-bar';
import { KpiCardsSection } from './components/kpi-cards-section';
import { AccountsSection } from './components/accounts-section';
import { DashboardCharts } from './components/dashboard-charts';
import TransactionsList from '@/app/(private)/transactions/components/transactions-list';
import CreateTransactionDialog from '@/app/(private)/transactions/components/create-transaction-dialog';
import UpdateTransactionDialog from '@/app/(private)/transactions/components/update-transaction-dialog';
import DayTransactionsDialog from '@/app/(private)/accounts/[id]/day-transactions-dialog';

// Skeleton hiển thị khi đang load hoặc render phía server để tránh hydration mismatch
function SkeletonDashboard() {
  return (
    <PrivatePageShell title="Tổng quan" description="Đang tải dữ liệu..." icon={LayoutDashboardIcon}>
      <div className="mt-6 flex flex-1 flex-col gap-6 animate-pulse">
        {/* KPI skeleton */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-[300px] rounded-3xl" />
          <Skeleton className="h-[300px] rounded-3xl" />
        </div>
        {/* Transactions list skeleton */}
        <Skeleton className="h-[200px] rounded-3xl" />
      </div>
    </PrivatePageShell>
  );
}

export default function DashboardPage() {
  const {
    mounted,
    timeRange,
    setTimeRange,
    referenceDate,
    setReferenceDate,
    createOpen,
    setCreateOpen,
    updateOpen,
    setUpdateOpen,
    selectedTransaction,
    setSelectedTransaction,
    selectedBucket,
    setSelectedBucket,
    activatingId,
    setActivatingId,
    fabRef,
    dragInfo,
    handleDragStart,
    accounts,
    stats,
    trendData,
    comparisonData,
    todayTransactions,
    handlePrevPeriod,
    handleNextPeriod,
    handleResetToToday,
    handleDeleteTransaction,
    handleMutationSuccess,
    activateAccount,
    periodLabel,
    isReportLoading,
    currentTransactions,
    prevTransactions
  } = useDashboardPage();

  // Nếu chưa mounted xong trên client thì hiển thị skeleton
  if (!mounted) {
    return <SkeletonDashboard />;
  }

  return (
    <>
      <PrivatePageShell
        title="Tổng quan"
        description="Theo dõi dòng tiền và các chỉ số quan trọng."
        icon={LayoutDashboardIcon}
        headerActions={
          <div className="flex items-center gap-3">
            {/* Reset to Today button */}
            {timeRange !== 'all' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetToToday}
                className="hidden md:inline-flex rounded-xl text-xs border-muted/50 hover:bg-accent bg-card/40"
              >
                Hôm nay
              </Button>
            )}
            {/* Desktop Add Transaction */}
            <Button
              type="button"
              className="hidden md:inline-flex rounded-xl"
              onClick={() => setCreateOpen(true)}
            >
              <PlusIcon className="mr-2 size-4" aria-hidden />
              Thêm giao dịch
            </Button>
          </div>
        }
      >

        {/* TIME FILTER BAR */}
        <TimeFilterBar
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          referenceDate={referenceDate}
          setReferenceDate={setReferenceDate}
          periodLabel={periodLabel}
          onPrevPeriod={handlePrevPeriod}
          onNextPeriod={handleNextPeriod}
        />

        {/* 2. KPI CARDS SECTION */}
        <KpiCardsSection
          stats={stats}
          timeRange={timeRange}
          accountsCount={accounts.length}
        />



        {/* 3. CHARTS COMPONENT */}
        <div className="mt-6">
          <DashboardCharts
            isLoading={isReportLoading}
            timeRange={timeRange}
            trendData={trendData}
            currentTransactions={currentTransactions}
            prevTransactions={prevTransactions}
            comparisonData={comparisonData}
            onSelectBucket={setSelectedBucket}
          />
        </div>

        {/* 4. MY ACCOUNTS SECTION */}
        <div className="mt-6">
          <AccountsSection
            accounts={accounts}
            activatingId={activatingId}
            setActivatingId={setActivatingId}
            activateAccount={activateAccount}
          />
        </div>

        {/* 5. TODAY'S TRANSACTIONS LIST */}
        <div className="mt-6 border bg-card/65 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5 select-none">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Giao dịch hôm nay
              </h3>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                {todayTransactions.length}
              </span>
            </div>
          </div>

          <TransactionsList
            transactions={todayTransactions}
            isLoading={isReportLoading}
            onRequestCreate={() => setCreateOpen(true)}
            onRequestDelete={handleDeleteTransaction}
            onRequestUpdate={(t) => {
              setSelectedTransaction(t);
              setUpdateOpen(true);
            }}
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
        aria-label="Thêm giao dịch nhanh"
      >
        <PlusIcon className="size-6 pointer-events-none" />
      </button>

      {/* DIALOGS CRUD */}
      {selectedBucket && (
        <DayTransactionsDialog
          open={!!selectedBucket}
          onOpenChange={(open) => {
            if (!open) setSelectedBucket(null);
          }}
          title={selectedBucket.label}
          transactions={selectedBucket.transactions}
          onUpdate={(t) => {
            setSelectedTransaction(t);
            setUpdateOpen(true);
          }}
          onDelete={handleDeleteTransaction}
        />
      )}

      <CreateTransactionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleMutationSuccess}
      />

      <UpdateTransactionDialog
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        transaction={selectedTransaction}
        onSuccess={handleMutationSuccess}
      />
    </>
  );
}
