import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isAdmin } from './lib/admin';
import { isMoodAdmin } from './lib/admin-mood';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 무드 영역(/mood-login, /mood/*)은 무드 프로젝트 세션으로 인가
  if (path.startsWith('/mood-login') || path.startsWith('/mood/')) {
    return handleMoodSection(request);
  }

  // 그 외 모든 경로는 톡 프로젝트 세션으로 인가 (기존 로직)
  return handleTalkSection(request);
}

/**
 * 톡 세션 + 톡 admin 권한 체크.
 * 로그인 페이지: /login
 */
async function handleTalkSection(request: NextRequest) {
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

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (user && !isAdmin(user.id) && !isLoginPage) {
    return NextResponse.redirect(
      new URL('/login?error=not_admin', request.url),
    );
  }
  if (user && isAdmin(user.id) && isLoginPage) {
    return NextResponse.redirect(new URL('/reports', request.url));
  }

  return response;
}

/**
 * 무드 세션 + 무드 admin 권한 체크.
 * 로그인 페이지: /mood-login
 */
async function handleMoodSection(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_MOOD!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_MOOD!,
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
  const isLoginPage = path.startsWith('/mood-login');

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL('/mood-login', request.url));
  }
  if (user && !isMoodAdmin(user.id) && !isLoginPage) {
    return NextResponse.redirect(
      new URL('/mood-login?error=not_admin', request.url),
    );
  }
  if (user && isMoodAdmin(user.id) && isLoginPage) {
    return NextResponse.redirect(new URL('/mood/reports', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};