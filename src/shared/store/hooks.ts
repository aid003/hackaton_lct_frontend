/**
 * Хуки для работы с store
 */

import { useStore } from './index';

/**
 * Хук для получения состояния загрузки
 */
export const useLoading = () => useStore((state) => state.loading);

/**
 * Хук для получения ошибки
 */
export const useError = () => useStore((state) => state.error);

/**
 * Хук для действий с ошибками
 */
export const useErrorActions = () => {
  const setError = useStore((state) => state.setError);
  const clearError = useStore((state) => state.clearError);
  
  return { setError, clearError };
};

/**
 * Хук для действий с загрузкой
 */
export const useLoadingActions = () => {
  const setLoading = useStore((state) => state.setLoading);
  
  return { setLoading };
};
