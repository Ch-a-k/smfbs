import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Массив путей, которые не требуют аутентификации
const publicPaths = ['/login', '/', '/api', '/images', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Проверяем, требуется ли аутентификация для данного пути
  const isPublicPath = publicPaths.some(path => 
    pathname.startsWith(path) || pathname === '/'
  );
  
  // Проверяем, начинается ли путь с /admin
  const isAdminPath = pathname.startsWith('/admin');
  
  // Получаем данные пользователя из cookies
  const userCookie = request.cookies.get('user')?.value;
  
  // Если путь требует аутентификации и токен отсутствует, перенаправляем на страницу входа
  if (isAdminPath && !userCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Если путь входа и пользователь уже аутентифицирован, перенаправляем на админ-панель
  if (pathname === '/login' && userCookie) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  
  // Если путь корневой админки, перенаправляем на страницу добавления бронирования
  if (pathname === '/admin' && userCookie) {
    return NextResponse.redirect(new URL('/admin/bookings/add', request.url));
  }
  
  return NextResponse.next();
}

// Настраиваем, для каких путей должен запускаться middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 