import { createBrowserClient } from '@supabase/ssr';

/**
 * 교랑빌리지 프로젝트(kyadyqbdugpemzimouxr)용 브라우저 클라이언트.
 * 빌리지 admin 페이지에서만 사용.
 */
export function createVillageBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_VILLAGE!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_VILLAGE!,
  );
}