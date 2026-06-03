"use client"

import { CheckIcon, ChevronsUpDownIcon, Landmark, PlusIcon, Sparkles, User, Users } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useWorkspaceStore } from "@/hooks/use-workspace"
import { useWorkspaceMutation, useWorkspaces } from "@/hooks/use-workspaces"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function WorkspaceSwitcher() {
  const router = useRouter()
  const { activeWorkspaceId, setActiveWorkspaceId } = useWorkspaceStore()
  const [openCreate, setOpenCreate] = React.useState(false)
  const [name, setName] = React.useState("")
  const { createWorkspace, isSubmitting: loading } = useWorkspaceMutation()
  const { isMobile, setOpenMobile } = useSidebar()

  const { data: workspacesData = [] } = useWorkspaces(false)
  const workspaces = React.useMemo(() => workspacesData, [workspacesData])

  // Tự động chọn workspace đầu tiên nếu chưa chọn hoặc workspace cũ không tồn tại
  React.useEffect(() => {
    if (workspaces.length > 0) {
      const exists = workspaces.some((w) => w.id === activeWorkspaceId)
      if (!activeWorkspaceId || !exists) {
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
        setActiveWorkspaceId(newWs.id)
        router.push("/dashboard")
        toast.success(`Đã tạo sổ chi tiêu mới: ${newWs.name}`)
        if (isMobile) {
          setOpenMobile(false)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể kết nối đến máy chủ"
      toast.error(errorMessage)
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
                className={cn(
                  "h-14 gap-3 px-3 py-2.5 cursor-pointer rounded-xl border transition-all duration-300",
                  "border-border/40 bg-card/40 dark:bg-card/20 shadow-xs backdrop-blur-xs",
                  "hover:bg-muted/80 hover:border-border/60",
                  "data-[state=open]:bg-muted data-[state=open]:border-border/60 data-[state=open]:shadow-xs"
                )}
              >
                {/* Icon Workspace được thiết kế rực rỡ với các dải gradient riêng biệt */}
                <div
                  className={cn(
                    "flex aspect-square size-9 items-center justify-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-105",
                    activeWorkspace.is_personal
                      ? "bg-linear-to-tr from-emerald-500 via-teal-500 to-cyan-400 shadow-emerald-500/10"
                      : "bg-linear-to-tr from-indigo-500 via-purple-500 to-fuchsia-400 shadow-indigo-500/10"
                  )}
                >
                  {activeWorkspace.is_personal ? (
                    <User className="size-4.5 stroke-[2.5]" />
                  ) : (
                    <Users className="size-4.5 stroke-[2.5]" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 leading-tight text-left flex-1 min-w-0">
                  <span className="font-semibold text-sm text-sidebar-foreground truncate">
                    {activeWorkspace.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium truncate">
                    {activeWorkspace.is_personal ? "Tài khoản cá nhân" : "Nhóm chi tiêu chung"}
                  </span>
                </div>
                <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent
              className="w-[var(--radix-dropdown-menu-trigger-width)] p-1.5 rounded-xl border-border/60 shadow-xl"
              align="start"
              sideOffset={6}
            >
              <div className="px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Danh sách sổ chi tiêu
              </div>
              <div className="space-y-1">
                {workspaces.map((workspace) => {
                  const isActive = workspace.id === activeWorkspaceId
                  return (
                    <DropdownMenuItem
                      key={workspace.id}
                      onSelect={() => {
                        setActiveWorkspaceId(workspace.id)
                        router.push("/dashboard")
                        toast.success(`Đã chuyển sang sổ chi tiêu: ${workspace.name}`)
                        if (isMobile) {
                          setOpenMobile(false)
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-200",
                        isActive 
                          ? "bg-primary/5 text-primary font-semibold border border-primary/10" 
                          : "hover:bg-muted border border-transparent hover:translate-x-0.5"
                      )}
                    >
                      {/* Icon rực rỡ cho từng workspace trong danh sách */}
                      <div
                        className={cn(
                          "flex size-7.5 shrink-0 items-center justify-center rounded-lg text-white shadow-xs",
                          workspace.is_personal
                            ? "bg-linear-to-tr from-emerald-500 to-teal-500"
                            : "bg-linear-to-tr from-indigo-500 to-purple-500"
                        )}
                      >
                        {workspace.is_personal ? (
                          <User className="size-3.5 stroke-[2.5]" />
                        ) : (
                          <Users className="size-3.5 stroke-[2.5]" />
                        )}
                      </div>
                      
                      <div className="flex flex-col min-w-0 flex-1 leading-none gap-0.5">
                        <span className="text-sm truncate">{workspace.name}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {workspace.is_personal ? "Cá nhân" : "Nhóm chung"}
                        </span>
                      </div>
                      
                      {isActive && (
                        <div className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <CheckIcon className="size-3 stroke-3" />
                        </div>
                      )}
                    </DropdownMenuItem>
                  )
                })}
              </div>
              
              <DropdownMenuSeparator className="my-1.5 border-border/50" />
              
              <DropdownMenuItem
                onSelect={() => setOpenCreate(true)}
                className={cn(
                  "flex items-center justify-center gap-2 px-2.5 py-2.5 rounded-lg border border-dashed",
                  "border-primary/30 text-primary bg-primary/5 hover:bg-primary hover:text-white hover:border-transparent",
                  "transition-all duration-300 font-semibold text-xs cursor-pointer shadow-2xs hover:shadow-md hover:shadow-primary/10"
                )}
              >
                <PlusIcon className="size-4 stroke-[2.5]" />
                Tạo nhóm chi tiêu mới
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl overflow-hidden border border-border/80 bg-background/95 backdrop-blur-md p-6 shadow-2xl transition-all duration-300">
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-3.5 pt-2">
              {/* Vòng tròn icon tạo nhóm với hiệu ứng pulse và gradient rực rỡ */}
              <div className="flex items-center justify-center size-14 rounded-full bg-linear-to-tr from-indigo-500 via-purple-500 to-fuchsia-400 text-white shadow-lg shadow-indigo-500/20 animate-pulse">
                <Users className="size-7 stroke-2" />
              </div>
              <div className="space-y-1">
                <DialogHeader className="space-y-1 p-0">
                  <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
                    Tạo nhóm chi tiêu mới
                    <Sparkles className="size-4.5 text-amber-400 fill-amber-400 animate-bounce" />
                  </DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-sm text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
                  Lập kế hoạch tài chính chung cho các chuyến đi, chi tiêu gia đình hoặc quỹ nhóm bạn bè cực kỳ dễ dàng.
                </DialogDescription>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="workspace-name"
                className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
              >
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
                  className={cn(
                    "h-11 rounded-xl px-4 bg-background/50 border-muted-foreground/20 text-base",
                    "transition-all duration-300 hover:bg-background/80 focus-visible:bg-background",
                    "focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-offset-0"
                  )}
                />
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1.5">
                <Landmark className="size-3.5 text-primary" />
                <span>Bạn sẽ tự động là <strong>Chủ nhóm</strong> và có toàn quyền quản lý.</span>
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
                className={cn(
                  "flex-1 sm:flex-initial h-11 px-6 rounded-xl font-semibold transition-all duration-300 active:scale-[0.98]",
                  "bg-linear-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-primary-foreground",
                  "shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2"
                )}
              >
                {loading ? (
                  <>
                    <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    Tạo nhóm
                    <PlusIcon className="size-4 stroke-[2.5]" />
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
