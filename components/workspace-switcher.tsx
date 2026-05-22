"use client"

import * as React from "react"
import { BuildingIcon, CheckIcon, ChevronsUpDownIcon, PlusIcon, Sparkles, Users } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { useWorkspaceStore } from "@/hooks/use-workspace"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useWorkspaceMutation } from "@/hooks/use-workspaces"

export function WorkspaceSwitcher() {
  const { user } = useAuth()
  const { activeWorkspaceId, setActiveWorkspaceId } = useWorkspaceStore()
  const [openCreate, setOpenCreate] = React.useState(false)
  const [name, setName] = React.useState("")
  const { createWorkspace, isSubmitting: loading } = useWorkspaceMutation()

  const workspaces = React.useMemo(() => user?.workspaces ?? [], [user?.workspaces])

  // Auto-select first workspace if no active workspace is set or if active workspace is not in the list (e.g. archived)
  React.useEffect(() => {
    if (workspaces.length > 0) {
      const exists = workspaces.some((w) => w.id === activeWorkspaceId)
      if (!activeWorkspaceId || !exists) {
        // Tìm workspace cá nhân trước
        const personal = workspaces.find((w) => w.is_personal)
        setActiveWorkspaceId(personal?.id ?? workspaces[0].id)
      }
    }
  }, [activeWorkspaceId, workspaces, setActiveWorkspaceId])

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0]

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      const newWs = await createWorkspace(name.trim())
      if (newWs?.id) {
        setName("")
        setOpenCreate(false)
        setActiveWorkspaceId(newWs.id) // Switch sang workspace mới
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể kết nối đến máy chủ";
      toast.error(errorMessage);
    }
  }

  if (!activeWorkspace) {
    return null
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <BuildingIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium truncate max-w-[140px]">{activeWorkspace.name}</span>
                  <span className="text-xs truncate">{activeWorkspace.is_personal ? 'Cá nhân' : 'Nhóm'}</span>
                </div>
                <ChevronsUpDownIcon className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width)"
              align="start"
            >
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onSelect={() => setActiveWorkspaceId(workspace.id)}
                >
                  {workspace.name}{" "}
                  {workspace.id === activeWorkspaceId && (
                    <CheckIcon className="ml-auto" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem 
                onSelect={() => setOpenCreate(true)} 
                className="border-t border-border mt-1 pt-2 text-primary focus:text-primary cursor-pointer"
              >
                <PlusIcon className="mr-2 size-4" />
                Tạo nhóm mới
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl overflow-hidden border border-border/80 bg-background/95 backdrop-blur-md p-6 shadow-2xl transition-all duration-300">
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 border border-primary/20 text-primary shadow-[0_0_15px_rgba(var(--primary),0.15)] animate-pulse">
                <Users className="size-6" />
              </div>
              <div className="space-y-1">
                <DialogHeader className="space-y-1 p-0">
                  <DialogTitle className="text-xl font-semibold tracking-tight text-foreground flex items-center justify-center gap-1.5">
                    Tạo nhóm chi tiêu mới
                    <Sparkles className="size-4 text-amber-500 fill-amber-500 animate-bounce" />
                  </DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-sm text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
                  Lập kế hoạch tài chính chung cho các chuyến đi, chi tiêu gia đình hoặc quỹ nhóm bạn bè.
                </DialogDescription>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="workspace-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                Tên nhóm chi tiêu
              </label>
              <div className="relative group">
                <Input
                  id="workspace-name"
                  placeholder="Ví dụ: Đi Vũng Tàu, Quỹ nhà..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                  autoFocus
                  className="h-11 rounded-xl px-4 border-muted-foreground/20 bg-background/50 hover:bg-background/80 transition-all duration-200 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-offset-0 text-base"
                />
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                <span>💡</span> Bạn sẽ tự động là <strong>Owner (chủ nhóm)</strong> và có toàn quyền quản lý.
              </p>
            </div>

            <DialogFooter className="flex flex-row gap-3 sm:justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenCreate(false)}
                disabled={loading}
                className="flex-1 sm:flex-initial h-11 px-5 rounded-xl border-border bg-background hover:bg-muted text-muted-foreground transition-all duration-200 active:scale-[0.98]"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 sm:flex-initial h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md shadow-primary/20 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    Tạo nhóm
                    <PlusIcon className="size-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

