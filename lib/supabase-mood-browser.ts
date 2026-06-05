import { createBrowserClient } from '@supabase/ssr';

/**
 * 무드 프로젝트(aqnsodvbfieimkjjcebf)용 브라우저 클라이언트.
 * 무드 admin 로그인 페이지에서만 사용.
 */
export function createMoodBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_MOOD!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_MOOD!,
  );
}