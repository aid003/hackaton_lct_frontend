'use client';

/**
 * Форма логина
 */

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { useUserActions } from '@/shared';

export function LoginForm() {
  const router = useRouter();
  const { setUser } = useUserActions();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Неверное имя пользователя или пароль');
        setIsLoading(false);
        return;
      }

      // Обновляем user-store из сессии
      const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' });
      if (sessionRes.ok) {
        const data: { user?: { id?: string; username?: string; name?: string | null } | null } = await sessionRes.json();
        const u = data.user;
        if (u && u.id && u.username) {
          setUser({ id: u.id, username: u.username, name: u.name ?? undefined });
        }
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError('Произошла ошибка при входе');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">
          Имя пользователя
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Пароль
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Вход...' : 'Войти'}
      </Button>
    </form>
  );
}
