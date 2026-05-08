import { create } from "zustand";

interface UIStore {
  createProjectOpen: boolean;
  openCreateProject: () => void;
  closeCreateProject: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  createProjectOpen: false,
  openCreateProject: () => set({ createProjectOpen: true }),
  closeCreateProject: () => set({ createProjectOpen: false }),
}));
