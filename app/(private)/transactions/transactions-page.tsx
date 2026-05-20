'use client';

import { MonthPicker } from '@/components/month-picker';
import { PrivatePageShell } from '@/components/private-page-shell';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  ArrowLeftRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  PlusIcon,
  SearchIcon
} from 'lucide-react';

import CreateTransactionDialog from './components/create-transaction-dialog';
import TransactionStatsCards from './components/transaction-stats-cards';
import TransactionsList from './components/transactions-list';
import UpdateTransactionDialog from './components/update-transaction-dialog';
import { useTransactionsPage } from './hooks/use-transactions-page';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'amount_desc', label: 'Số tiền: cao → thấp' },
  { value: 'amount_asc', label: 'Số tiền: thấp → cao' },
] as const;

export default function TransactionsPage() {
  const {
    transactions,
    isLoading,
    fetchTransactions,
    month,
    setMonth,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    sort,
    setSort,
    createOpen,
    setCreateOpen,
    updateOpen,
    setUpdateOpen,
    selectedTransaction,
    setSelectedTransaction,
    fabRef,
    dragInfo,
    handleDragStart,
    filtered,
    handleDelete,
  } = useTransactionsPage();

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Sắp xếp';

  return (
    <>
      <PrivatePageShell
        title="Giao dịch"
        description="Ghi nhận thu — chi, lọc và tìm kiếm nhanh."
        icon={ArrowLeftRightIcon}
        headerActions={
          <Button type="button" className="rounded-xl" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="mr-2 size-4" aria-hidden />
            Thêm giao dịch
          </Button>
        }
      >
        {/* Stats summary cards */}
        <div className="mt-5">
          <TransactionStatsCards transactions={transactions} isLoading={isLoading} />
        </div>

        {/* Filter / Search bar - Tối ưu hóa bố cục mobile để không bị lệch */}
        <div className="mt-5 space-y-4 rounded-2xl border bg-card/75 p-4 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-card/60 sm:p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Row 1: Search & Month navigation */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <SearchIcon
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/75"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo danh mục, ghi chú…"
                className="h-11 rounded-xl pl-10 bg-background/40 border-muted-foreground/20 focus:bg-background/80 transition-all text-sm"
              />
            </div>

            {/* Month picker - Căn giữa trên di động để cân bằng bố cục */}
            <div className="flex items-center justify-center md:justify-end w-full md:w-auto">
              <MonthPicker value={month} onChange={setMonth} />
            </div>
          </div>

          <Separator className="opacity-60" />

          {/* Row 2: Bộ lọc dạng Segment và Sắp xếp (Được thiết kế lại cho mobile) */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row sm:items-center flex-1">
              {/* Phân loại thu chi (Segmented control) - Dàn đều 100% trên mobile */}
              <div className="flex w-full sm:w-auto p-1 rounded-xl bg-muted/50 border border-muted-foreground/10 gap-0.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={cn(
                    "flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 text-center",
                    typeFilter === 'all'
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('expense')}
                  className={cn(
                    "flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 text-center",
                    typeFilter === 'expense'
                      ? "bg-rose-500/10 text-rose-500"
                      : "text-muted-foreground hover:text-rose-500"
                  )}
                >
                  Chi tiêu
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('income')}
                  className={cn(
                    "flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 text-center",
                    typeFilter === 'income'
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "text-muted-foreground hover:text-emerald-500"
                  )}
                >
                  Thu nhập
                </button>
              </div>

              {/* Sắp xếp và Chỉ số thống kê: Thẳng hàng và phân bổ đều 2 bên trên mobile, đẩy về phải trên desktop */}
              <div className="flex items-center justify-between gap-3 w-full flex-1">
                {/* Sort dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="h-9 px-3 rounded-xl border-muted-foreground/20 text-xs font-medium gap-1.5 hover:bg-accent bg-background/30 transition-all active:scale-95 flex-1 sm:flex-none justify-center">
                      <CalendarIcon className="size-3.5 text-muted-foreground/75" aria-hidden />
                      <span>Xếp: {currentSortLabel}</span>
                      <ChevronDownIcon className="size-3.5 opacity-60" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-48 rounded-xl shadow-lg border">
                    {SORT_OPTIONS.map((o) => (
                      <DropdownMenuItem key={o.value} onClick={() => setSort(o.value)} className="rounded-lg text-xs py-2 cursor-pointer">
                        <span className={cn('mr-2 inline-flex size-1.5 rounded-full bg-muted-foreground/30', sort === o.value && 'bg-primary')} />
                        {o.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Stats */}
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground shrink-0 px-1 select-none sm:ml-auto">
                  <span>Tìm thấy</span>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-muted text-foreground font-semibold border border-muted-foreground/10">
                    {filtered.length}
                  </span>
                  <span>giao dịch</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions list */}
        <div className="mt-5">
          <TransactionsList
            transactions={filtered}
            isLoading={isLoading}
            onRequestCreate={() => setCreateOpen(true)}
            onRequestDelete={handleDelete}
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
        aria-label="Thêm giao dịch"
      >
        <PlusIcon className="size-6 pointer-events-none" />
      </button>

      <CreateTransactionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchTransactions}
      />

      <UpdateTransactionDialog
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        transaction={selectedTransaction}
        onSuccess={fetchTransactions}
      />
    </>
  );
}


