import { createClient } from '@/lib/supabase-server';
import { createVillageAdminClient } from '@/lib/supabase-village-server';
import { isAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import BannedUsersClient from './BannedUsersClient';

export const dynamic = 'force-dynamic';

export type BannedUserRow = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  banned_at: string | null;
  banned_reason: string | null;
};

export default async function VillageBannedUsersPage() {
  // 1. 교랑톡 어드민 인증 체크
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!isAdmin(user.email)) redirect('/login?error=not_admin');

  // 2. 정지된 사용자 조회
  const admin = createVillageAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id, nickname, avatar_url, banned_at, banned_reason')
    .eq('is_banned', true)
    .order('banned_at', { ascending: false })
    .limit(200);

  const rows: BannedUserRow[] = (data ?? []).map((r) => ({
    id: r.id as string,
    nickname: (r.nickname as string | null) ?? '(닉네임 없음)',
    avatar_url: (r.avatar_url as string | null) ?? null,
    banned_at: (r.banned_at as string | null) ?? null,
    banned_reason: (r.banned_reason as string | null) ?? null,
  }));

  return <BannedUsersClient rows={rows} error={error?.message} />;
}