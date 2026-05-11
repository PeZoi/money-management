import { PrivatePageShell } from '@/components/private-page-shell';
import { ArrowLeftRightIcon } from 'lucide-react';

export default function TransactionsPage() {
  return (
    <PrivatePageShell
      title="Giao dịch"
      description="Ghi nhận thu — chi, lọc và tìm kiếm nhanh."
      icon={ArrowLeftRightIcon}
    >
      <p className="mt-6 text-sm text-muted-foreground">Nội dung trang giao dịch sẽ được bổ sung sau.</p>
    </PrivatePageShell>
  );
}
