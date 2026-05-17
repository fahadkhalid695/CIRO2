import { create } from 'zustand';

interface AppState {
  crisisLevel: string;
  setCrisisLevel: (level: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  crisisLevel: 'low',
  setCrisisLevel: (level) => set({ crisisLevel: level }),
}));
