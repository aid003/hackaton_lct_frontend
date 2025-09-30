/**
 * Middleware для защиты маршрутов
 */

import { auth } from '@/shared/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Публичные маршруты
  const isPublicRoute = pathname === '/login';

  // Если не авторизован и пытается зайти на защищенную страницу
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Если авторизован и пытается зайти на страницу логина
  if (isLoggedIn && pathname === '/login') {
    const homeUrl = new URL('/', req.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
