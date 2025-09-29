/**
 * Store для фичи Auth
 */

import { createTypedStore } from '@/shared/lib';
import type { BaseState } from '@/shared/store/types';

interface AuthState extends BaseState {
  isAuthenticated: boolean;
  token: string | null;
}

interface AuthActions {
  login: (token: string) => void;
  logout: () => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
}

export const useAuthStore = createTypedStore<AuthState, AuthActions>(
  'auth-store',
  {
    loading: false,
    error: null,
    isAuthenticated: false,
    token: null,
  },
  (set) => ({
    login: (token) => set({ token, isAuthenticated: true }),
    logout: () => set({ token: null, isAuthenticated: false }),
    setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  })
);
