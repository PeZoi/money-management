'use client';

import * as React from 'react';
import { WalletIcon, RefreshCwIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatVnd } from '@/app/(private)/transactions/transaction-ui';
import type { AccountRow } from '@/types/database';

interface AccountsSectionProps {
  accounts: AccountRow[];
  activatingId: string | null;
  setActivatingId: (id: string | null) => void;
  activateAccount: (id: string) => Promise<boolean>;
}

export function AccountsSection({
  accounts,
  activatingId,
  setActivatingId,
  activateAccount,
}: AccountsSectionProps) {
  const router = useRouter();

  return (
    <div id="my-accounts-section" className="mt-6 border bg-card/45 backdrop-blur-md rounded-3xl p-5 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
      <div className="flex items-center justify-between mb-4 select-none animate-in fade-in duration-300">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <WalletIcon className="size-3.5 text-blue-500" />
          Tài khoản &amp; Ví của bạn
        </h3>
        <span className="text-[10px] font-bold text-muted-foreground/80 bg-muted px-2.5 py-0.5 rounded-md uppercase tracking-wider">
          {accounts.length} ví hoạt động
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {accounts.map((a, idx) => {
          const isActive = a.is_active;
          const isActivating = activatingId === a.id;
          return (
            <div
              key={a.id}
              onClick={() => {
                router.push(`/accounts/${a.id}`);
              }}
              className="flex items-center justify-between gap-4 bg-card/75 border rounded-2xl p-3 sm:p-3.5 shadow-xs min-w-[210px] flex-1 sm:flex-none transition-all duration-300 relative group/acc cursor-pointer hover:-translate-y-1 hover:shadow-md hover:bg-card active:scale-98 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
              style={{
                borderColor: isActive ? a.color : `${a.color}25`,
                borderWidth: isActive ? '2px' : '1px',
                backgroundColor: isActive ? `${a.color}05` : undefined,
                animationDelay: `${idx * 50}ms`,
                animationDuration: '400ms'
              }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Icon của ví với background màu tương ứng */}
                <div
                  className="size-10 rounded-xl flex items-center justify-center text-base font-semibold select-none shrink-0 transition-all duration-300 group-hover/acc:scale-105 group-hover/acc:rotate-3"
                  style={{
                    backgroundColor: `${a.color}15`,
                    border: `1px solid ${a.color}40`,
                    color: a.color
                  }}
                >
                  {a.icon || '💳'}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-xs font-bold text-foreground/85 truncate leading-tight group-hover/acc:text-foreground transition-colors">
                      {a.name}
                    </p>
                    {isActive && (
                      <span
                        className="inline-block size-1.5 rounded-full animate-ping shrink-0"
                        style={{ backgroundColor: a.color }}
                      />
                    )}
                  </div>
                  <p className="text-sm font-extrabold text-foreground tracking-tight tabular-nums group-hover/acc:scale-[1.01] origin-left transition-transform truncate">
                    {formatVnd(a.balance)}
                  </p>
                </div>
              </div>

              {/* Nút / Badge Active ở góc phải */}
              <div className="shrink-0 flex items-center justify-center pl-1 select-none">
                {isActive ? (
                  <span
                    className="inline-flex h-6 items-center justify-center px-2 rounded-lg text-[9px] font-black tracking-wider uppercase border shadow-inner"
                    style={{
                      backgroundColor: `${a.color}15`,
                      borderColor: `${a.color}35`,
                      color: a.color
                    }}
                  >
                    Đang dùng
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={!!activatingId}
                    onClick={async (e) => {
                      e.stopPropagation(); // Không trigger chuyển trang của thẻ ví
                      if (activatingId) return;
                      setActivatingId(a.id);
                      try {
                        await activateAccount(a.id);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setActivatingId(null);
                      }
                    }}
                    className="inline-flex h-6 items-center justify-center rounded-lg px-2 text-[9px] font-black uppercase tracking-wider transition-all border border-border/60 bg-muted/65 text-muted-foreground hover:bg-card hover:text-foreground hover:border-foreground/20 active:scale-90 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    {isActivating ? (
                      <RefreshCwIcon className="size-3 animate-spin text-muted-foreground" />
                    ) : (
                      'Kích hoạt'
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
