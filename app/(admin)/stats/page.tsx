import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const REASON_LABELS: Record<string, string> = {
  spam: '스팸/광고',
  inappropriate: '부적절한 내용',
  sexual: '음란물',
  violence: '폭력/위협',
  fraud: '사기/사칭',
  hate: '혐오 발언',
  harassment: '괴롭힘',
  privacy: '개인정보 침해',
  other: '기타',
};

export default async function StatsPage() {
  const supabase = createAdminClient();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 3600 * 1000);
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 3600 * 1000);

  const [
    totalUsersResp,
    totalReportsResp,
    pendingReportsResp,
    last7dReportsResp,
    last30dReportsResp,
    blocksResp,
    reasonsResp,
    newUsersResp,
  ] = await Promise.all([
    supabase.from('kyorangtalk_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('kyorangtalk_reports').select('id', { count: 'exact', head: true }),
    supabase
      .from('kyorangtalk_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('kyorangtalk_reports')
      .select('id, created_at, status')
      .gte('created_at', sevenDaysAgo.toISOString()),
    supabase
      .from('kyorangtalk_reports')
      .select('id, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString()),
    supabase.from('kyorangtalk_blocks').select('id', { count: 'exact', head: true }),
    supabase
      .from('kyorangtalk_reports')
      .select('reason')
      .gte('created_at', thirtyDaysAgo.toISOString()),
    supabase
      .from('kyorangtalk_profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString()),
  ]);

  const totalUsers = totalUsersResp.count || 0;
  const totalReports = totalReportsResp.count || 0;
  const pendingReports = pendingReportsResp.count || 0;
  const totalBlocks = blocksResp.count || 0;
  const newUsers7d = newUsersResp.count || 0;
  const last7dCount = last7dReportsResp.data?.length || 0;

  // 사유별 분포 (최근 30일)
  const reasonCounts: Record<string, number> = {};
  for (const r of reasonsResp.data || []) {
    reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
  }
  const reasonsSorted = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9);
  const maxReason = Math.max(...reasonsSorted.map(([, c]) => c), 1);

  // 일별 신고 추이 (최근 30일)
  const daily: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(today.getTime() - i * 24 * 3600 * 1000);
    const key = d.toISOString().slice(0, 10);
    daily[key] = 0;
  }
  for (const r of last30dReportsResp.data || []) {
    const key = new Date(r.created_at).toISOString().slice(0, 10);
    if (key in daily) daily[key]++;
  }
  const dailySorted = Object.entries(daily)
    .sort((a, b) => a[0].localeCompare(b[0]));
  const maxDaily = Math.max(...dailySorted.map(([, c]) => c), 1);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black mb-1">통계</h1>
        <p className="text-sm text-white/50">
          신고/차단/사용자 현황을 한눈에 확인하세요
        </p>
      </header>

      {/* 카드 4개 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="전체 사용자"
          value={totalUsers.toLocaleString()}
          sub={`최근 7일 +${newUsers7d}`}
        />
        <StatCard
          label="대기 중인 신고"
          value={pendingReports.toLocaleString()}
          sub={`전체 ${totalReports.toLocaleString()}건`}
          highlight={pendingReports > 0}
        />
        <StatCard
          label="최근 7일 신고"
          value={last7dCount.toLocaleString()}
          sub="건"
        />
        <StatCard
          label="누적 차단"
          value={totalBlocks.toLocaleString()}
          sub="건"
        />
      </div>

      {/* 일별 추이 */}
      <div className="bg-bgCard border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-bold mb-4">일별 신고 추이 (최근 30일)</h2>
        <div className="flex items-end gap-1 h-40">
          {dailySorted.map(([date, count]) => (
            <div
              key={date}
              className="flex-1 flex flex-col items-center gap-1 group relative"
            >
              <div
                className="w-full bg-primary/60 hover:bg-primary rounded-t transition-colors"
                style={{
                  height: `${(count / maxDaily) * 100}%`,
                  minHeight: count > 0 ? '4px' : '1px',
                }}
              />
              <span className="text-[9px] text-white/30 -rotate-45 origin-top-left absolute top-full mt-1">
                {date.slice(5)}
              </span>
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-bg border border-border rounded px-2 py-1 text-xs whitespace-nowrap z-10">
                {date}: {count}건
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-xs text-white/40">
          가장 많은 날: {maxDaily}건
        </div>
      </div>

      {/* 사유별 분포 */}
      <div className="bg-bgCard border border-border rounded-2xl p-6">
        <h2 className="font-bold mb-4">신고 사유별 분포 (최근 30일)</h2>
        {reasonsSorted.length === 0 ? (
          <p className="text-sm text-white/40 py-8 text-center">
            데이터가 없어요
          </p>
        ) : (
          <div className="space-y-3">
            {reasonsSorted.map(([reason, count]) => (
              <div key={reason}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold">
                    {REASON_LABELS[reason] || reason}
                  </span>
                  <span className="text-sm text-white/60">{count}건</span>
                </div>
                <div className="h-2 bg-bg rounded overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(count / maxReason) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-bgCard border rounded-2xl p-5 ${
        highlight ? 'border-yellow-500/40' : 'border-border'
      }`}
    >
      <p className="text-xs text-white/40 mb-2">{label}</p>
      <p
        className={`text-3xl font-black ${
          highlight ? 'text-yellow-400' : 'text-white'
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
    </div>
  );
}
