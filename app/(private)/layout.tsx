import { AppSidebar } from "@/components/app-sidebar";
import { AuthBootstrap } from "@/components/auth-bootstrap";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  
  return (
    <>
    <SidebarProvider>
      <AuthBootstrap />
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
            <h1 className="text-lg font-semibold">Money DPH</h1>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
    </>
  );
}

