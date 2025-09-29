/**
 * Селекторы для store
 */

import { useStore } from './index';

/**
 * Селектор для проверки наличия ошибки
 */
export const useHasError = () => useStore((state) => !!state.error);

/**
 * Селектор для проверки состояния загрузки
 */
export const useIsLoading = () => useStore((state) => state.loading);

/**
 * Селектор для получения полного состояния
 */
export const useAppState = () => useStore((state) => ({
  loading: state.loading,
  error: state.error,
}));
