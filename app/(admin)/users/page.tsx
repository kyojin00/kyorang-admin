import { createAdminClient } from '@/lib/supabase-admin';
import UsersClient from './UsersClient';

export const dynamic = 'force-dynamic';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createAdminClient();
  const q = searchParams.q || '';

  let query = supabase
    .from('kyorangtalk_profiles')
    .select('id, nickname, avatar_url, created_at, status_message')
    .order('created_at', { ascending: false })
    .limit(50);

  if (q.trim()) {
    query = query.ilike('nickname', `%${q.trim()}%`);
  }

  const { data: users, error } = await query;

  // 각 사용자의 신고 받은 수 / 차단 당한 수
  const userIds = (users || []).map((u) => u.id);

  const [reportsData, blocksData] = await Promise.all([
    supabase
      .from('kyorangtalk_reports')
      .select('reported_user_id')
      .in('reported_user_id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']),
    supabase
      .from('kyorangtalk_blocks')
      .select('blocked_id')
      .in('blocked_id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']),
  ]);

  const reportCounts: Record<string, number> = {};
  for (const r of reportsData.data || []) {
    if (r.reported_user_id) {
      reportCounts[r.reported_user_id] = (reportCounts[r.reported_user_id] || 0) + 1;
    }
  }

  const blockCounts: Record<string, number> = {};
  for (const b of blocksData.data || []) {
    blockCounts[b.blocked_id] = (blockCounts[b.blocked_id] || 0) + 1;
  }

  const enriched = (users || []).map((u) => ({
    ...u,
    report_count: reportCounts[u.id] || 0,
    block_count: blockCounts[u.id] || 0,
  }));

  return <UsersClient users={enriched} currentQuery={q} error={error?.message} />;
}
