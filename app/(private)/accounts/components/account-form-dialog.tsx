'use client';

import type { AccountRow } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { BanknoteIcon, BuildingIcon, Loader2Icon, PiggyBankIcon, SmartphoneIcon, WalletIcon } from 'lucide-react';

import { useAccountForm } from '../hooks/use-account-form';

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Tiền mặt', icon: WalletIcon, color: '#10b981', description: 'Tiền trong ví, tay' },
  { value: 'bank', label: 'Ngân hàng', icon: BuildingIcon, color: '#6366f1', description: 'Tài khoản ngân hàng' },
  { value: 'e_wallet', label: 'Ví điện tử', icon: SmartphoneIcon, color: '#f59e0b', description: 'MoMo, ZaloPay...' },
  {
    value: 'investment',
    label: 'Đầu tư',
    icon: PiggyBankIcon,
    color: '#ec4899',
    description: 'Chứng khoán, tiết kiệm',
  },
  { value: 'other', label: 'Khác', icon: BanknoteIcon, color: '#64748b', description: 'Loại tài khoản khác' },
] as const;

const PRESET_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#84cc16',
  '#64748b',
];

const PRESET_ICONS = ['💰', '🏦', '💳', '👛', '💵', '🏧', '📱', '💹', '🐷', '💎'];

type AccountFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AccountRow | null;
  onSuccess?: () => void;
};

function normalizeHexInput(raw: string): string {
  let s = raw.trim().replace(/[^#0-9a-fA-F]/g, '');
  if (!s.startsWith('#')) s = `#${s}`;
  if (s.length > 7) s = s.slice(0, 7);
  return s;
}

export default function AccountFormDialog({ open, onOpenChange, account, onSuccess }: AccountFormDialogProps) {
  const { form, isUpdate, isSubmitting, onSubmit, setFormattedBalance } = useAccountForm({
    open,
    onOpenChange,
    account,
    onSuccess,
  });

  // Watch tất cả giá trị để render UI reactive
  const name = form.watch('name');
  const type = form.watch('type');
  const balance = form.watch('balance');
  const icon = form.watch('icon');
  const color = form.watch('color');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} fullScreenOnMobile className="max-w-xl gap-0 p-0">
        <DialogHeader className="border-b px-5 py-4 sm:px-6">
          <DialogTitle>{isUpdate ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Vùng nhập liệu của tài khoản có thể cuộn độc lập */}
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-5">
            {/* Tên tài khoản */}
            <div className="grid gap-2">
              <Label htmlFor="account-name">Tên tài khoản</Label>
              <Input
                id="account-name"
                {...form.register('name')}
                placeholder="Ví dụ: Ví tiền mặt, MB Bank, MoMo..."
                className="h-11 rounded-xl"
                disabled={isSubmitting}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-rose-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Loại tài khoản */}
            <div className="grid gap-2">
              <Label>Loại tài khoản</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ACCOUNT_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => form.setValue('type', t.value)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isSelected
                          ? 'border-primary/50 bg-primary/10 shadow-sm ring-2 ring-primary/25'
                          : 'border-border bg-card hover:bg-muted/50',
                        isSubmitting && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-sm',
                          isSelected
                            ? 'border-primary/30 bg-primary/15 text-primary'
                            : 'border-border bg-muted/40 text-muted-foreground',
                        )}
                      >
                        <Icon className="size-4.5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <div className={cn('text-sm font-semibold', isSelected && 'text-primary')}>{t.label}</div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Số dư ban đầu */}
            <div className="grid gap-2">
              <Label htmlFor="account-balance" className={cn(form.formState.errors.balance && 'text-destructive')}>
                Số dư {isUpdate ? 'hiện tại' : 'ban đầu'}
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  ₫
                </span>
                <Input
                  id="account-balance"
                  type="text"
                  inputMode="numeric"
                  value={balance}
                  onChange={(e) => {
                    // Định dạng số tiền khi người dùng gõ nhập, giữ lại dấu trừ nếu có
                    setFormattedBalance(e.target.value);
                  }}
                  className={cn(
                    'h-11 rounded-xl pl-8 transition-all duration-200',
                    form.formState.errors.balance && 'border-destructive focus-visible:ring-destructive text-destructive'
                  )}
                  disabled={isSubmitting}
                  placeholder="0"
                />
              </div>
              {form.formState.errors.balance ? (
                <p className="text-xs font-medium text-destructive mt-0.5">
                  {form.formState.errors.balance.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nhập số dư {isUpdate ? 'hiện tại' : 'khi bắt đầu theo dõi'}. Số âm nếu đang nợ.
                </p>
              )}
            </div>

            {/* Icon + Màu */}
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Icon */}
              <div className="grid gap-2 flex-1">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => form.setValue('icon', ic)}
                      className={cn(
                        'size-10 flex items-center justify-center rounded-xl border text-xl transition-all',
                        icon === ic
                          ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/30'
                          : 'border-border bg-card hover:bg-muted/50',
                      )}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <Separator orientation="vertical" className="hidden sm:block self-stretch" />

              {/* Màu */}
              <div className="grid gap-2 flex-1">
                <Label htmlFor="account-color">Màu sắc</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="account-color"
                    type="color"
                    value={color}
                    onChange={(e) => form.setValue('color', e.target.value, { shouldValidate: true })}
                    disabled={isSubmitting}
                    className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-input bg-background p-1 shadow-xs disabled:opacity-50"
                  />
                  <Input
                    value={color}
                    onChange={(e) => form.setValue('color', normalizeHexInput(e.target.value), { shouldValidate: true })}
                    placeholder="#6366f1"
                    spellCheck={false}
                    disabled={isSubmitting}
                    className="h-11 rounded-xl font-mono text-sm"
                    maxLength={7}
                  />
                </div>
                {/* Preset colors */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => form.setValue('color', c, { shouldValidate: true })}
                      style={{ backgroundColor: c }}
                      className={cn(
                        'size-7 rounded-lg border-2 transition-all',
                        color === c ? 'border-foreground scale-110' : 'border-transparent',
                      )}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <Separator />
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Xem trước</p>
              <div
                className="relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm flex items-center gap-4"
                style={{ borderColor: `${color}40` }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-10"
                  style={{ background: `linear-gradient(135deg, ${color}, transparent)` }}
                  aria-hidden
                />
                <div
                  className="relative flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm border"
                  style={{ backgroundColor: `${color}20`, borderColor: `${color}40` }}
                >
                  {icon}
                </div>
                <div className="relative min-w-0 flex-1">
                  <p className="truncate font-semibold">{name.trim() || 'Tên tài khoản'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ACCOUNT_TYPES.find((t) => t.value === type)?.label ?? 'Loại'}
                  </p>
                </div>
                <div className="relative text-right">
                  <p className="text-sm font-bold tabular-nums">
                    {(Number(balance.replace(/[^0-9-]/g, '')) || 0).toLocaleString('vi-VN')}₫
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Phần nút điều khiển (Footer) được cố định ở chân dialog */}
          <div className="border-t px-5 py-4 sm:px-6 bg-muted/10 shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" className="rounded-xl" disabled={isSubmitting || !name.trim()}>
                {isSubmitting && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                {isUpdate ? 'Lưu thay đổi' : 'Tạo tài khoản'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
