'use client';

import * as React from 'react';
import Image from 'next/image';
import { SearchIcon, CheckIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { POPULAR_BANKS, type BankInfo } from '@/lib/constants/banks';
import { cn } from '@/lib/utils';

interface BankSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBankId: string;
  onSelectBank: (bank: BankInfo) => void;
}

export function BankSelectorModal({
  open,
  onOpenChange,
  selectedBankId,
  onSelectBank,
}: BankSelectorModalProps) {
  const [search, setSearch] = React.useState('');

  const filteredBanks = React.useMemo(() => {
    if (!search.trim()) return POPULAR_BANKS;
    const q = search.toLowerCase().trim();
    return POPULAR_BANKS.filter(
      (b) =>
        b.shortName.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.bin.includes(q) ||
        b.id.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden sm:rounded-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="text-base font-semibold text-center">
            Chọn ngân hàng thanh toán
          </DialogTitle>
          <div className="relative mt-2">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên ngân hàng, VCB, MB..."
              className="pl-9 h-10 rounded-xl bg-muted/50 border-muted-foreground/20 text-sm"
              autoFocus={false}
            />
          </div>
        </DialogHeader>

        {/* Danh sách ngân hàng dạng cuộn */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-border/30">
          {filteredBanks.map((bank) => {
            const isSelected = bank.id === selectedBankId;
            return (
              <button
                key={bank.id}
                type="button"
                onClick={() => {
                  onSelectBank(bank);
                  try {
                    localStorage.setItem('preferred_pay_bank', bank.id);
                  } catch {
                    // ignore localStorage errors
                  }
                  onOpenChange(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left group',
                  isSelected
                    ? 'bg-primary/10 border border-primary/20 text-foreground'
                    : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground',
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-11 rounded-lg border bg-white p-1 flex items-center justify-center shrink-0 shadow-2xs">
                    <Image
                      src={bank.logo}
                      alt={bank.shortName}
                      width={38}
                      height={38}
                      className="size-9 object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {bank.shortName}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {bank.name}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 ml-2 shadow-xs">
                    <CheckIcon className="size-3.5" />
                  </div>
                )}
              </button>
            );
          })}

          {filteredBanks.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Không tìm thấy ngân hàng phù hợp.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
