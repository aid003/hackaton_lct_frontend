/**
 * Провайдер, синхронизирующий Zustand user-store с сессией NextAuth
 */

'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/entities';
import { useUserActions } from '@/shared';

interface AuthSyncProviderProps {
  children: ReactNode;
}

interface SessionResponse {
  user?: {
    id?: string;
    username?: string;
    name?: string | null;
  } | null;
}

async function fetchSessionUser(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/session', { cache: 'no-store' });
    if (!res.ok) return null;
    const data: SessionResponse = await res.json();
    const sessionUser = data.user;
    if (!sessionUser || !sessionUser.id || !sessionUser.username) return null;
    return {
      id: sessionUser.id,
      username: sessionUser.username,
      name: sessionUser.name ?? undefined,
    };
  } catch {
    return null;
  }
}

export function AuthSyncProvider({ children }: AuthSyncProviderProps) {
  const { setUser, setInitialized } = useUserActions();

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const user = await fetchSessionUser();
      if (!isMounted) return;
      setUser(user);
      setInitialized(true);
    })();
    return () => {
      isMounted = false;
    };
  }, [setUser, setInitialized]);

  return <>{children}</>;
}


