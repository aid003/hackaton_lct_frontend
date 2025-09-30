/**
 * User store на Zustand
 */

import { create } from 'zustand';
import type { User } from '@/entities';

export interface UserState {
  user: User | null;
  isInitialized: boolean;
}

export interface UserActions {
  setUser: (user: User | null) => void;
  resetUser: () => void;
  setInitialized: (initialized: boolean) => void;
}

export type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()((set) => ({
  user: null,
  isInitialized: false,

  setUser: (user) => set({ user }),
  resetUser: () => set({ user: null }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
}));

export const useUser = () => useUserStore((state) => state.user);
export const useIsUserInitialized = () =>
  useUserStore((state) => state.isInitialized);
export const useUserActions = () => {
  const setUser = useUserStore((state) => state.setUser);
  const resetUser = useUserStore((state) => state.resetUser);
  const setInitialized = useUserStore((state) => state.setInitialized);
  return { setUser, resetUser, setInitialized };
};


