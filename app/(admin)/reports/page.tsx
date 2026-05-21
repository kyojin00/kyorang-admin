import { createAdminClient } from '@/lib/supabase-admin';
import ReportsClient from './ReportsClient';

export const dynamic = 'force-dynamic';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string };
}) {
  // ⭐ service role 사용 — RLS 우회해서 모든 신고 데이터 조회
  const supabase = createAdminClient();
  const status = searchParams.status || 'pending';
  const type = searchParams.type || 'all';

  let query = supabase
    .from('kyorangtalk_reports')
    .select(`
      *,
      reporter:reporter_id(id, nickname, avatar_url),
      reported:reported_user_id(id, nickname, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (status !== 'all') {
    query = query.eq('status', status);
  }
  if (type !== 'all') {
    query = query.eq('report_type', type);
  }

  const { data: reports, error } = await query;

  // 카운트 (상태별)
  const { data: countsRaw } = await supabase
    .from('kyorangtalk_reports')
    .select('status');

  const counts = {
    all: countsRaw?.length || 0,
    pending: countsRaw?.filter((r) => r.status === 'pending').length || 0,
    resolved: countsRaw?.filter((r) => r.status === 'resolved').length || 0,
    rejected: countsRaw?.filter((r) => r.status === 'rejected').length || 0,
  };

  return (
    <ReportsClient
      reports={reports || []}
      counts={counts}
      currentStatus={status}
      currentType={type}
      error={error?.message}
    />
  );
}