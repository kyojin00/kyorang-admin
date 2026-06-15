import { createClient } from '@supabase/supabase-js';

/**
 * 교랑빌리지 프로젝트용 서버 클라이언트 (service_role).
 *
 * 무드와 달리, 빌리지는 전화번호 인증 기반이라 어드민이 직접 세션을
 * 만들지 않는다. 대신 service_role로 RLS를 우회해서 신고를 조회하고
 * 처리한다. 이 함수는 반드시 서버 코드(서버 컴포넌트 / 서버 액션 /
 * Route Handler)에서만 호출해야 한다. 클라이언트에 노출 금지.
 */
export function createVillageAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_VILLAGE!,
    process.env.SUPABASE_SERVICE_ROLE_KEY_VILLAGE!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}