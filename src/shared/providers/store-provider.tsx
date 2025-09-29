/**
 * Провайдер для store
 */

'use client';

import { ReactNode } from 'react';

interface StoreProviderProps {
  children: ReactNode;
}

/**
 * Провайдер для store
 * В Zustand провайдер не обязателен, но может быть полезен для инициализации
 */
export function StoreProvider({ children }: StoreProviderProps) {
  return <>{children}</>;
}
