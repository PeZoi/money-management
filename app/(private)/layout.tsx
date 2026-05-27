import { AppSidebar } from '@/components/app-sidebar';
import { AuthBootstrap } from '@/components/auth-bootstrap';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import Logo from '../assets/images/logo.png';
import Image from 'next/image';
import Link from 'next/link';
import { BottomNav } from '@/components/bottom-nav';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { WorkspaceSetupDialog } from '@/components/workspace-setup-dialog';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SidebarProvider>
        <AuthBootstrap />
        <AppSidebar />
        {/* pb-24 md:pb-0 để chừa khoảng trống cho thanh điều hướng dưới cùng trên mobile */}
        <SidebarInset className="pb-24 md:pb-0">
          <header className="flex h-auto shrink-0 items-center justify-between border-b px-4 py-3 pt-[calc(env(safe-area-inset-top)+12px)] bg-background">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="data-vertical:h-4 data-vertical:self-auto" />
              <Link href="/">
                <Image
                  src={Logo}
                  alt="Money DPH"
                  width={160}
                  height={160}
                  className="h-15 w-auto cursor-pointer object-contain"
                  loading="eager"
                  priority
                />
              </Link>
            </div>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
      <BottomNav />
      <ConfirmDialog />
      <WorkspaceSetupDialog />
    </>
  );
}
