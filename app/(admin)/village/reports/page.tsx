import { createClient } from '@/lib/supabase-server';
import { createVillageAdminClient } from '@/lib/supabase-village-server';
import { isAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import ReportsClient from './ReportsClient';

export const dynamic = 'force-dynamic';

const TARGET_TYPE_LABEL: Record<string, string> = {
  user: '사용자',
  village: '마을',
  post: '게시글',
  comment: '댓글',
  message: '메시지',
};

export type VillageReportTarget = {
  type: string;
  id: string;
  label: string;
  preview?: string;
  authorId?: string | null;
  authorNickname?: string | null;
  authorIsBanned?: boolean;
};

export type VillageReportRow = {
  id: string;
  status: 'pending' | 'resolved' | 'dismissed';
  reason: string;
  created_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
  reporter_nickname: string | null;
  target: VillageReportTarget;
};

export default async function VillageReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // 1. 교랑톡 어드민 인증 체크
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!isAdmin(user.email)) redirect('/login?error=not_admin');

  // 2. 신고 목록 조회
  const params = await searchParams;
  const status = params.status ?? 'pending';

  const admin = createVillageAdminClient();
  const baseQuery = admin
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  const { data: filtered } =
    status === 'all' ? await baseQuery : await baseQuery.eq('status', status);

  const rows: VillageReportRow[] = await Promise.all(
    (filtered ?? []).map(async (r) => {
      const target = await loadTarget(r.target_type, r.target_id);
      const reporter = await loadProfileNickname(r.reporter_id);
      return {
        id: r.id,
        status: r.status,
        reason: r.reason,
        created_at: r.created_at,
        resolved_at: r.resolved_at,
        resolution_note: r.resolution_note,
        reporter_nickname: reporter,
        target,
      };
    }),
  );

  // 카운트
  const { count: pendingCount } = await admin
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return (
    <ReportsClient
      rows={rows}
      currentStatus={status}
      pendingCount={pendingCount ?? 0}
    />
  );
}

// ===========================================================
// 헬퍼 (서버 사이드)
// ===========================================================

async function loadProfileNickname(userId: string): Promise<string | null> {
  const admin = createVillageAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('nickname')
    .eq('id', userId)
    .maybeSingle();
  return data?.nickname ?? null;
}

async function loadTarget(
  type: string,
  id: string,
): Promise<VillageReportTarget> {
  const admin = createVillageAdminClient();
  const label = TARGET_TYPE_LABEL[type] ?? type;

  switch (type) {
    case 'user': {
      const { data } = await admin
        .from('profiles')
        .select('id, nickname, is_banned')
        .eq('id', id)
        .maybeSingle();
      return {
        type,
        id,
        label,
        preview: data?.nickname ?? '(삭제됨)',
        authorId: data?.id ?? null,
        authorNickname: data?.nickname ?? null,
        authorIsBanned: data?.is_banned ?? false,
      };
    }
    case 'post': {
      const { data } = await admin
        .from('posts')
        .select('content, author_id, profiles!posts_author_id_fkey(nickname, is_banned)')
        .eq('id', id)
        .maybeSingle();
      // @ts-expect-error - profiles 조인 타입
      const profile = data?.profiles ?? null;
      return {
        type,
        id,
        label,
        preview: data?.content ?? '(삭제됨)',
        authorId: data?.author_id ?? null,
        authorNickname: profile?.nickname ?? null,
        authorIsBanned: profile?.is_banned ?? false,
      };
    }
    case 'comment': {
      const { data } = await admin
        .from('comments')
        .select('content, author_id, profiles(nickname, is_banned)')
        .eq('id', id)
        .maybeSingle();
      // @ts-expect-error - profiles 조인 타입
      const profile = data?.profiles ?? null;
      return {
        type,
        id,
        label,
        preview: data?.content ?? '(삭제됨)',
        authorId: data?.author_id ?? null,
        authorNickname: profile?.nickname ?? null,
        authorIsBanned: profile?.is_banned ?? false,
      };
    }
    case 'message': {
      const vm = await admin
        .from('village_messages')
        .select('content, sender_id, profiles(nickname, is_banned)')
        .eq('id', id)
        .maybeSingle();
      if (vm.data) {
        // @ts-expect-error
        const profile = vm.data.profiles ?? null;
        return {
          type,
          id,
          label: '마을 메시지',
          preview: vm.data.content ?? '(삭제됨)',
          authorId: vm.data.sender_id,
          authorNickname: profile?.nickname ?? null,
          authorIsBanned: profile?.is_banned ?? false,
        };
      }
      const dm = await admin
        .from('dm_messages')
        .select('content, sender_id, profiles(nickname, is_banned)')
        .eq('id', id)
        .maybeSingle();
      if (dm.data) {
        // @ts-expect-error
        const profile = dm.data.profiles ?? null;
        return {
          type,
          id,
          label: 'DM 메시지',
          preview: dm.data.content ?? '(삭제됨)',
          authorId: dm.data.sender_id,
          authorNickname: profile?.nickname ?? null,
          authorIsBanned: profile?.is_banned ?? false,
        };
      }
      return { type, id, label, preview: '(삭제됨)' };
    }
    case 'village': {
      const { data } = await admin
        .from('villages')
        .select('name, owner_id')
        .eq('id', id)
        .maybeSingle();
      return {
        type,
        id,
        label,
        preview: data?.name ?? '(삭제됨)',
        authorId: data?.owner_id ?? null,
      };
    }
    default:
      return { type, id, label, preview: '(알 수 없는 대상)' };
  }
}