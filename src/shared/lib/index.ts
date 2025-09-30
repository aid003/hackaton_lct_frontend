/**
 * Утилиты и вспомогательные функции
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export { cn } from './utils';

/**
 * Создает типизированный store с devtools
 */
export function createTypedStore<TState, TActions>(
  name: string,
  initialState: TState,
  actions: (set: (partial: Partial<TState & TActions>) => void) => TActions
) {
  return create<TState & TActions>()(
    devtools(
      (set) => ({
        ...initialState,
        ...actions(set),
      }),
      {
        name,
      }
    )
  );
}
