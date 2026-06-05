import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * 무드 프로젝트(aqnsodvbfieimkjjcebf)용 서버 클라이언트.
 * @supabase/ssr 이 프로젝트 ref 로 쿠키 이름을 자동 분리하므로
 * 톡 세션과 충돌 없이 동시 유지된다.
 *
 * 무드 admin RPC 는 is_admin()(auth.uid() 기반)으로 인가하므로
 * service_role 이 아니라 이 쿠키 세션 클라이언트를 써야 한다.
 */
export function createMoodClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_MOOD!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_MOOD!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: CookieOptions;
          }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component 에서 호출된 경우 무시
          }
        },
      },
    },
  );
}