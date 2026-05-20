'use client';

import { useMemo, useState } from 'react';

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
import { useTransactionMutation, useTransactions } from '@/hooks/use-transactions';
import { cn } from '@/lib/utils';
import {
  ArrowLeftRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  PlusIcon,
  SearchIcon
} from 'lucide-react';

import type { TransactionType, TransactionWithCategory } from '@/types/database';
import CreateTransactionDialog from './components/create-transaction-dialog';
import TransactionStatsCards from './components/transaction-stats-cards';
import TransactionsList from './components/transactions-list';
import UpdateTransactionDialog from './components/update-transaction-dialog';
import { normalizeText, typeLabel } from './transaction-ui';

type FilterType = 'all' | TransactionType;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'amount_desc', label: 'Số tiền: cao → thấp' },
  { value: 'amount_asc', label: 'Số tiền: thấp → cao' },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]['value'];

export default function TransactionsPage() {
  const { transactions, isLoading, fetchTransactions, month, setMonth } = useTransactions();
  const { deleteTransaction } = useTransactionMutation();

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [createOpen, setCreateOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithCategory | null>(null);


  const filtered = useMemo(() => {
    const q = normalizeText(query);

    let list = transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (!q) return true;
      const hay = normalizeText(
        `${t.category?.name ?? ''} ${t.note ?? ''} ${typeLabel(t.type)}`
      );
      return hay.includes(q);
    });

    list = [...list].sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === 'amount_desc') return Number(b.amount) - Number(a.amount);
      if (sort === 'amount_asc') return Number(a.amount) - Number(b.amount);
      return 0;
    });

    return list;
  }, [transactions, query, typeFilter, sort]);

  const handleDelete = async (id: string) => {
    await deleteTransaction(id, { onSuccess: fetchTransactions });
  };

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

        {/* Filter / Search bar */}
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

            {/* Month picker */}
            <div className="flex items-center justify-start md:justify-end">
              <MonthPicker value={month} onChange={setMonth} />
            </div>
          </div>

          <Separator className="opacity-60" />

          {/* Row 2: Segment filters, Sort, and Stats */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Type filter pill switcher */}
              <div className="flex p-1 rounded-xl bg-muted/50 border border-muted-foreground/10 gap-0.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={cn(
                    "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95",
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
                    "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95",
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
                    "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95",
                    typeFilter === 'income'
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "text-muted-foreground hover:text-emerald-500"
                  )}
                >
                  Thu nhập
                </button>
              </div>

              {/* Sort dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="h-9 px-3 rounded-xl border-muted-foreground/20 text-xs font-medium gap-1.5 hover:bg-accent bg-background/30 transition-all active:scale-95">
                    <CalendarIcon className="size-3.5 text-muted-foreground/75" aria-hidden />
                    <span>Xếp theo: {currentSortLabel}</span>
                    <ChevronDownIcon className="size-3.5 opacity-60" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-48 rounded-xl shadow-lg border">
                  {SORT_OPTIONS.map((o) => (
                    <DropdownMenuItem key={o.value} onClick={() => setSort(o.value)} className="rounded-lg text-xs py-2 cursor-pointer">
                      <span className={cn('mr-2 inline-flex size-1.5 rounded-full bg-muted-foreground/30', sort === o.value && 'bg-primary')} />
                      {o.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground px-1">
              <span>Tìm thấy</span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-muted text-foreground font-semibold border border-muted-foreground/10">
                {filtered.length}
              </span>
              <span>giao dịch</span>
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
