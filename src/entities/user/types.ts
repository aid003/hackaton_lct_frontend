/**
 * Типы сущности User
 */

export interface User {
  id: string;
  username: string;
  name?: string;
}

export type AuthenticatedUser = User;


