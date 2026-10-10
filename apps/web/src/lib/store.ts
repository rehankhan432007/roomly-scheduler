import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'OWNER';
}

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  user: { id: 'c0000000-0000-4000-8000-000000000001', name: 'Rahul Mehta', email: 'client@meetmaze.dev', role: 'CLIENT' }, // Dummy client user
  setUser: (user) => set({ user }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}));
