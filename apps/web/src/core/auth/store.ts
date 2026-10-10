// Auth store — zustand store for user state
'use client';

import { create } from 'zustand';
import { api } from '../api/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'OWNER';
  company?: string | null;
  phone?: string | null;
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; role: 'CLIENT' | 'OWNER'; company?: string; phone?: string }) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (data: { name?: string; company?: string | null; phone?: string | null }) => Promise<User>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: 'loading',

  login: async (email, password) => {
    const data = await api.post<{ user: User; token: string }>('/auth/login', { email, password });
    set({ user: data.user, status: 'authenticated' });
    return data.user;
  },

  register: async (input) => {
    const data = await api.post<{ user: User; token: string }>('/auth/register', input);
    set({ user: data.user, status: 'authenticated' });
    return data.user;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    set({ user: null, status: 'unauthenticated' });
  },

  refresh: async () => {
    try {
      const data = await api.get<{ user: User }>('/auth/me');
      set({ user: data.user, status: 'authenticated' });
    } catch {
      set({ user: null, status: 'unauthenticated' });
    }
  },

  updateProfile: async (input) => {
    const data = await api.patch<{ user: User }>('/users/me', input);
    set({ user: data.user });
    return data.user;
  },
}));
