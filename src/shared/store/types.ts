/**
 * Базовые типы для store
 */

export interface BaseState {
  loading: boolean;
  error: string | null;
}

export interface StoreState extends BaseState {
  // Базовое состояние приложения
}

export interface StoreActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export type Store = StoreState & StoreActions;
