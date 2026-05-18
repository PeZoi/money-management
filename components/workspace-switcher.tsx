"use client"

import * as React from "react"
import { BuildingIcon, CheckIcon, ChevronsUpDownIcon } from "lucide-react"

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
import { useAuthStore } from "@/hooks/use-auth"
import { useWorkspaceStore } from "@/hooks/use-workspace"
import type { WorkspaceInfo } from "@/types/user"

export function WorkspaceSwitcher() {
  const { user } = useAuthStore()
  const { activeWorkspaceId, setActiveWorkspaceId } = useWorkspaceStore()

  const workspaces = user?.workspaces ?? []

  // Auto-select first workspace if no active workspace is set
  React.useEffect(() => {
    if (!activeWorkspaceId && workspaces.length > 0) {
      setActiveWorkspaceId(workspaces[0].id)
    }
  }, [activeWorkspaceId, workspaces, setActiveWorkspaceId])

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0]

  if (!activeWorkspace) {
    return null
  }

  return (
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
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
