import { createClient as createSbClient } from '@supabase/supabase-js';

/**
 * Service Role 키를 사용하는 클라이언트.
 * RLS 우회 가능 — 절대 클라이언트로 노출되면 안 됨.
 * 서버 컴포넌트나 API 라우트에서만 사용.
 */
export function createAdminClient() {
  return createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
