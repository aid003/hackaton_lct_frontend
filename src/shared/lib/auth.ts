/**
 * Конфигурация NextAuth
 */

import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

/**
 * Расширение типов сессии
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    username: string;
  }
}

/**
 * Типы для пользователя из переменных окружения
 */
interface EnvUser {
  username: string;
  password: string;
}

/**
 * Получение пользователей из .env
 */
function getUsersFromEnv(): EnvUser[] {
  const users: EnvUser[] = [];
  let i = 1;

  while (process.env[`USER_${i}_USERNAME`]) {
    const username = process.env[`USER_${i}_USERNAME`];
    const password = process.env[`USER_${i}_PASSWORD`];

    if (username && password) {
      users.push({ username, password });
    }
    i++;
  }

  return users;
}

/**
 * Конфигурация NextAuth
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = credentials.username as string;
        const password = credentials.password as string;

        // Получаем пользователей из .env
        const users = getUsersFromEnv();

        // Находим пользователя
        const user = users.find((u) => u.username === username);

        if (!user) {
          return null;
        }

        // Проверяем пароль в открытом виде (без хеша)
        if (password !== user.password) {
          return null;
        }

        // Возвращаем данные пользователя
        return {
          id: username,
          username: username,
          name: username,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
