import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type WorkspaceState = {
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string) => void;
  includeSavings: boolean;
  setIncludeSavings: (include: boolean) => void;
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
      includeSavings: true,
      setIncludeSavings: (include) => set({ includeSavings: include }),
    }),
    {
      name: 'workspace-storage',
    }
  )
);
