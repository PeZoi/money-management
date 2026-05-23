import { Skeleton } from '@/components/ui/skeleton';
import type { AccountRow } from '@/types/database';

interface AccountCardProps {
  account?: AccountRow | null;
  isLoading?: boolean;
}

export function AccountCard({ account, isLoading }: AccountCardProps) {
  if (isLoading || !account) {
    return <Skeleton className="h-44 w-full rounded-2xl" />;
  }

  const balance = Number(account.balance);
  const cardColor = account.color || '#6366f1';

  if (account.type === 'bank' || account.type === 'e_wallet') {
    return (
      <div
        className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg flex flex-col justify-between h-44 select-none animate-in fade-in duration-300"
        style={{
          background: `linear-gradient(135deg, ${cardColor} 0%, rgba(15, 23, 42, 0.95) 100%)`,
          boxShadow: `inset 0 1.5px 0 0 rgba(255, 255, 255, 0.2), 0 12px 24px -8px ${cardColor}40`,
        }}
      >
        <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
        <div className="absolute -right-8 -bottom-8 size-32 rounded-full bg-white/5 blur-xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between gap-1 relative z-10">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-black tracking-widest text-white/85 uppercase truncate">
              {account.type === 'bank' ? 'THẺ NGÂN HÀNG' : 'VÍ ĐIỆN TỬ'}
            </span>
            <span className="relative flex size-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
            </span>
          </div>
          
          {/* Chip đồng giả lập */}
          <div className="relative flex h-5 w-7 shrink-0 items-center justify-center rounded-sm bg-linear-to-br from-amber-300 via-yellow-400 to-amber-500 border border-amber-200/50 shadow-xs">
            <div className="absolute inset-x-0 top-1/2 h-[0.5px] bg-amber-700/30" />
            <div className="absolute inset-y-0 left-1/2 w-[0.5px] bg-amber-700/30" />
            <div className="absolute top-0.5 bottom-0.5 left-1 right-1 border-[0.5px] border-amber-700/20 rounded-xs" />
          </div>
        </div>

        {/* Body */}
        <div className="my-1 relative z-10">
          <span className="text-[9px] text-white/60 font-semibold tracking-wider block">SỐ DƯ KHẢ DỤNG</span>
          <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-white tabular-nums truncate">
            {balance < 0 ? '-' : ''}
            {Math.abs(balance).toLocaleString('vi-VN')}₫
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between gap-1 mt-auto relative z-10">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-bold tracking-wide text-white truncate uppercase">
              {account.name}
            </p>
          </div>
          <span className="text-xl sm:text-2xl shrink-0 drop-shadow-md">
            {account.icon || '💳'}
          </span>
        </div>
      </div>
    );
  }

  // Giao diện Tiền mặt
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 border shadow-lg flex flex-col justify-between h-44 select-none animate-in fade-in duration-300 bg-linear-to-br from-emerald-50 via-emerald-100/70 to-teal-50 border-emerald-500/20 text-emerald-950 dark:from-emerald-950/40 dark:to-emerald-900/60 dark:border-emerald-500/10 dark:text-emerald-50"
      style={{
        boxShadow: `0 12px 24px -8px rgba(16,185,129,0.15)`,
      }}
    >
      <div className="absolute inset-1 border border-dashed border-emerald-600/15 dark:border-emerald-400/15 rounded-xl pointer-events-none" />
      <div className="absolute right-2 top-2 text-7xl text-emerald-500/5 dark:text-emerald-400/5 pointer-events-none font-bold select-none">
        💵
      </div>

      <div className="flex flex-col h-full justify-between gap-3 relative z-10">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-black tracking-widest text-emerald-700/85 dark:text-emerald-400/85 uppercase truncate">
              TIỀN MẶT
            </span>
            <span className="relative flex size-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-xl sm:text-2xl drop-shadow-xs">💵</span>
        </div>

        <div className="my-1">
          <span className="text-[9px] text-emerald-700/60 dark:text-emerald-400/60 font-semibold tracking-wider block">TIỀN MẶT CÓ SẴN</span>
          <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400 tabular-nums truncate">
            {balance < 0 ? '-' : ''}
            {Math.abs(balance).toLocaleString('vi-VN')}₫
          </p>
        </div>

        <div className="mt-auto">
          <span className="text-[9px] text-emerald-700/40 dark:text-emerald-400/40 block">TÊN VÍ TIỀN</span>
          <p className="text-xs sm:text-sm font-bold tracking-wide truncate uppercase">
            {account.name}
          </p>
        </div>
      </div>
    </div>
  );
}
