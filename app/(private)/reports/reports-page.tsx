import { PrivatePageShell } from '@/components/private-page-shell';
import { BarChart3Icon } from 'lucide-react';

export default function ReportsPage() {
  return (
    <PrivatePageShell title="Báo cáo" description="Biểu đồ và thống kê theo thời gian." icon={BarChart3Icon}>
      <p className="mt-6 text-sm text-muted-foreground">Nội dung trang báo cáo sẽ được bổ sung sau.</p>
    </PrivatePageShell>
  );
}
