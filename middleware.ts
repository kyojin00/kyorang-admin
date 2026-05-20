import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isAdmin } from './lib/admin';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLoginPage = path.startsWith('/login');

  // 로그인 안 됨 + 로그인 페이지 아님 → 로그인으로
  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 로그인 됐지만 관리자 아님 → 로그인 페이지로 (에러 표시)
  if (user && !isAdmin(user.id) && !isLoginPage) {
    return NextResponse.redirect(
      new URL('/login?error=not_admin', request.url),
    );
  }

  // 이미 로그인된 관리자가 로그인 페이지 접근 → 홈으로
  if (user && isAdmin(user.id) && isLoginPage) {
    return NextResponse.redirect(new URL('/reports', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // _next/static, _next/image, favicon, public 파일 제외
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};