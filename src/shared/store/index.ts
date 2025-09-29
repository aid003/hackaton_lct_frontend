/**
 * Главный store приложения
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Store } from './types';

export const useStore = create<Store>()(
  devtools(
    (set) => ({
      // Начальное состояние
      loading: false,
      error: null,

      // Действия
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'main-store',
    }
  )
);

// Экспорт типов и хуков
export type { Store, StoreState, StoreActions, BaseState } from './types';
export * from './hooks';
export * from './selectors';