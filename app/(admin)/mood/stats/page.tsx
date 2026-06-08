import { createMoodClient } from '@/lib/supabase-mood-server';

export const dynamic = 'force-dynamic';

type StatsRow = {
  total_requests: number;
  total_replies: number;
  pending_requests: number;
  active_users_7d: number;
  new_users_7d: number;
  replies_7d: number;
  reports_7d: number;
  pending_review: number;
  banned_users: number;
};

type DailyRow = {
  day: string;
  reply_count: number;
  report_count: number;
};

type CategoryRow = { tag: string; count: number };
type MoodLevelRow = { mood_level: number; count: number };

// 대분류 영문 → 한글 매핑 (구버전 데이터 + 신버전 세부 태그 모두 표시).
const TAG_LABELS: Record<string, string> = {
  work: '일과 진로',
  relationship: '사람과 관계',
  anxiety: '불안과 걱정',
  fatigue: '지치고 무기력',
  loneliness: '외로움',
  sadness: '슬픔',
  etc: '기타',
  미선택: '미선택',
};

const MOOD_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: '많이 가라앉음', color: 'bg-red-500/60' },
  2: { label: '가라앉음', color: 'bg-orange-500/60' },
  3: { label: '보통', color: 'bg-yellow-500/60' },
  4: { label: '괜찮음', color: 'bg-lime-500/60' },
  5: { label: '좋음', color: 'bg-green-500/60' },
};

export default async function MoodStatsPage() {
  const supabase = createMoodClient();

  const [statsResp, dailyResp, categoryResp, moodResp] = await Promise.all([
    supabase.rpc('admin_mood_stats'),
    supabase.rpc('admin_mood_daily_replies', { p_days: 30 }),
    supabase.rpc('admin_mood_category_dist', { p_days: 30 }),
    supabase.rpc('admin_mood_level_dist', { p_days: 30 }),
  ]);

  const stats =
    ((statsResp.data ?? []) as StatsRow[])[0] ?? {
      total_requests: 0,
      total_replies: 0,
      pending_requests: 0,
      active_users_7d: 0,
      new_users_7d: 0,
      replies_7d: 0,
      reports_7d: 0,
      pending_review: 0,
      banned_users: 0,
    };
  const daily = (dailyResp.data ?? []) as DailyRow[];
  const categories = (categoryResp.data ?? []) as CategoryRow[];
  const moodLevels = (moodResp.data ?? []) as MoodLevelRow[];

  const maxDaily = Math.max(
    1,
    ...daily.map((d) => Math.max(d.reply_count, d.report_count)),
  );
  const maxCategory = Math.max(1, ...categories.map((c) => c.count));
  const maxMood = Math.max(1, ...moodLevels.map((m) => m.count));

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black mb-1">무드 · 통계</h1>
        <p className="text-sm text-white/50">
          익명 위로 풀 운영 현황 · 최근 30일 기준
        </p>
      </header>

      {/* 카드 4개 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="누적 위로 발송"
          value={stats.total_replies.toLocaleString()}
          sub={`전체 요청 ${stats.total_requests.toLocaleString()}건`}
        />
        <StatCard
          label="검토 대기"
          value={stats.pending_review.toLocaleString()}
          sub={
            stats.pending_review > 0 ? '확인이 필요해요' : '깨끗해요 ✨'
          }
          highlight={stats.pending_review > 0}
        />
        <StatCard
          label="활성 사용자 (7일)"
          value={stats.active_users_7d.toLocaleString()}
          sub={`신규 +${stats.new_users_7d}`}
        />
        <StatCard
          label="차단 유저"
          value={stats.banned_users.toLocaleString()}
          sub={`최근 7일 신고 ${stats.reports_7d}건`}
        />
      </div>

      {/* 일별 추이 */}
      <div className="bg-bgCard border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-bold">일별 위로 발송 · 신고 추이</h2>
          <div className="flex gap-3 text-xs text-white/50">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-primary/60"></span>위로
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500/60"></span>신고
            </span>
          </div>
        </div>

        {daily.length === 0 ? (
          <p className="text-sm text-white/40 py-8 text-center">
            데이터가 없어요
          </p>
        ) : (
          <>
            <div className="flex items-end gap-1 h-40">
              {daily.map((d) => (
                <div
                  key={d.day}
                  className="flex-1 flex flex-col-reverse gap-0.5 group relative min-w-0"
                >
                  <div
                    className="w-full bg-primary/60 hover:bg-primary rounded-t transition-colors"
                    style={{
                      height: `${(d.reply_count / maxDaily) * 80}%`,
                      minHeight: d.reply_count > 0 ? '4px' : '1px',
                    }}
                  />
                  <div
                    className="w-full bg-red-500/60 hover:bg-red-500 rounded-t transition-colors"
                    style={{
                      height: `${(d.report_count / maxDaily) * 80}%`,
                      minHeight: d.report_count > 0 ? '2px' : '0px',
                    }}
                  />
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover:block bg-bg border border-border rounded px-2 py-1 text-xs whitespace-nowrap z-10">
                    <div className="text-white/70">{d.day}</div>
                    <div className="text-primary">위로 {d.reply_count}건</div>
                    {d.report_count > 0 && (
                      <div className="text-red-400">신고 {d.report_count}건</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-[10px] text-white/30">
              <span>{daily[0]?.day.slice(5)}</span>
              <span>{daily[daily.length - 1]?.day.slice(5)}</span>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 카테고리 분포 */}
        <div className="bg-bgCard border border-border rounded-2xl p-6">
          <h2 className="font-bold mb-4">요청 카테고리 분포</h2>
          {categories.length === 0 ? (
            <p className="text-sm text-white/40 py-8 text-center">
              데이터가 없어요
            </p>
          ) : (
            <div className="space-y-3">
              {categories.map((c) => (
                <div key={c.tag}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">
                      {TAG_LABELS[c.tag] ?? c.tag}
                    </span>
                    <span className="text-sm text-white/60">{c.count}건</span>
                  </div>
                  <div className="h-2 bg-bg rounded overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(c.count / maxCategory) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 기분 단계 분포 */}
        <div className="bg-bgCard border border-border rounded-2xl p-6">
          <h2 className="font-bold mb-4">요청 시 기분 단계</h2>
          {moodLevels.length === 0 ? (
            <p className="text-sm text-white/40 py-8 text-center">
              데이터가 없어요
            </p>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((level) => {
                const row = moodLevels.find((m) => m.mood_level === level);
                const count = row?.count ?? 0;
                const info = MOOD_LABELS[level];
                return (
                  <div key={level}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">
                        {level}단계 · {info.label}
                      </span>
                      <span className="text-sm text-white/60">{count}건</span>
                    </div>
                    <div className="h-2 bg-bg rounded overflow-hidden">
                      <div
                        className={`h-full ${info.color}`}
                        style={{ width: `${(count / maxMood) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-white/40">
        ℹ️ 모든 통계는 최근 30일 기준이며, 페이지 새로고침 시 최신 데이터로 갱신됩니다.
      </p>
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