import { create } from 'zustand';

interface AuthState {
  did: string | null;
  handle: string | null;
  setSession: (did: string, handle: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  did: null,
  handle: null,
  setSession: (did, handle) => set({ did, handle }),
  clearSession: () => set({ did: null, handle: null }),
}));
