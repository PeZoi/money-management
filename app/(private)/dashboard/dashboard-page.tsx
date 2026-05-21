import { PrivatePageShell } from '@/components/private-page-shell';
import { createClient } from '@/lib/supabase/server';
import { LayoutDashboardIcon } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    redirect('/login');
  }
  console.log({ data });

  return (
    <PrivatePageShell
      title="Tổng quan"
      description="Theo dõi dòng tiền và các chỉ số quan trọng."
      icon={LayoutDashboardIcon}
    >
      <div className="mt-6 flex flex-1 flex-col gap-4">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
        </div>
        <div className="min-h-[40vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      </div>
    </PrivatePageShell>
  );
}
