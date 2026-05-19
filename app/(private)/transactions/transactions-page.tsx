'use client';

import { useMemo, useState } from 'react';

import { PrivatePageShell } from '@/components/private-page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useTransactions, useTransactionMutation } from '@/hooks/use-transactions';
import { cn } from '@/lib/utils';
import {
  ArrowLeftRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';

import CreateTransactionDialog from './components/create-transaction-dialog';
import TransactionStatsCards from './components/transaction-stats-cards';
import TransactionsList from './components/transactions-list';
import UpdateTransactionDialog from './components/update-transaction-dialog';
import { normalizeText, typeLabel } from './transaction-ui';
import type { TransactionType, TransactionWithCategory } from '@/types/database';

type FilterType = 'all' | TransactionType;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'amount_desc', label: 'Số tiền: cao → thấp' },
  { value: 'amount_asc', label: 'Số tiền: thấp → cao' },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]['value'];

export default function TransactionsPage() {
  const { transactions, isLoading, fetchTransactions } = useTransactions();
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
        <div className="mt-5 rounded-2xl border bg-card/70 p-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/60 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-50"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo danh mục, ghi chú…"
                className="h-11 rounded-xl pl-9"
              />
            </div>

            {/* Right controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="rounded-xl">
                    <SlidersHorizontalIcon className="mr-2 size-4" aria-hidden />
                    {typeFilter === 'all' ? 'Tất cả' : typeFilter === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                    <ChevronDownIcon className="ml-2 size-4 opacity-60" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-44">
                  <DropdownMenuItem onClick={() => setTypeFilter('all')}>
                    <span className={cn('mr-2 inline-flex size-2 rounded-full bg-muted-foreground/40', typeFilter === 'all' && 'bg-primary')} />
                    Tất cả
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter('expense')}>
                    <span className={cn('mr-2 inline-flex size-2 rounded-full bg-muted-foreground/40', typeFilter === 'expense' && 'bg-rose-500')} />
                    Chi tiêu
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter('income')}>
                    <span className={cn('mr-2 inline-flex size-2 rounded-full bg-muted-foreground/40', typeFilter === 'income' && 'bg-emerald-500')} />
                    Thu nhập
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="rounded-xl">
                    <CalendarIcon className="mr-2 size-4" aria-hidden />
                    {currentSortLabel}
                    <ChevronDownIcon className="ml-2 size-4 opacity-60" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52">
                  {SORT_OPTIONS.map((o) => (
                    <DropdownMenuItem key={o.value} onClick={() => setSort(o.value)}>
                      <span className={cn('mr-2 inline-flex size-2 rounded-full bg-muted-foreground/40', sort === o.value && 'bg-primary')} />
                      {o.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="hidden h-6 sm:block" />

              <Badge className="rounded-xl px-3 py-2 text-sm">
                {filtered.length} giao dịch
              </Badge>
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
