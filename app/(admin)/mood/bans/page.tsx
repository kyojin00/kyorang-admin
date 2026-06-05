import { createMoodClient } from '@/lib/supabase-mood-server';
import ConfirmButton from '../reports/confirm-button';
import { unbanUser } from '../reports/actions';

type BannedUser = {
  user_id: string;
  email: string | null;
  reason: string;
  banned_at: string;
  report_count: number;
};

export const dynamic = 'force-dynamic';

export default async function MoodBansPage() {
  const supabase = createMoodClient();

  const { data, error } = await supabase.rpc('admin_list_bans', {
    p_limit: 200,
  });

  const rows = (data ?? []) as BannedUser[];

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black mb-1">무드 · 차단 유저</h1>
          <p className="text-sm text-white/50">
            발송 차단된 사용자 목록 · 부당 차단은 차단 해제로 풀어줄 수 있어요
          </p>
        </div>
        <a
          href="/mood/reports"
          className="text-sm text-white/50 hover:text-white underline underline-offset-2"
        >
          ← 신고된 위로
        </a>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          불러오기 실패: {error.message}
        </div>
      )}

      {!error && rows.length === 0 ? (
        <div className="bg-bgCard border border-border rounded-2xl py-16 text-center text-white/40 text-sm">
          차단된 사용자가 없어요
        </div>
      ) : (
        <div className="bg-bgCard border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg/50 text-xs text-white/50 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">사용자</th>
                <th className="px-4 py-3 text-left">차단 사유</th>
                <th className="px-4 py-3 text-center">누적 신고</th>
                <th className="px-4 py-3 text-left">차단 일시</th>
                <th className="px-4 py-3 text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr
                  key={b.user_id}
                  className="border-t border-border hover:bg-white/5 align-top"
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold break-all">
                      {b.email || <span className="text-white/30">—</span>}
                    </div>
                    <div className="text-xs text-white/30 font-mono mt-0.5">
                      {b.user_id.slice(0, 8)}…
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-md">
                    <span className="text-sm text-white/70">{b.reason}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {b.report_count > 0 ? (
                      <span className="inline-block min-w-[28px] px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-bold">
                        {b.report_count}
                      </span>
                    ) : (
                      <span className="text-white/30 text-sm">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/50 whitespace-nowrap">
                    {new Date(b.banned_at).toLocaleString('ko-KR', {
                      year: '2-digit',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end flex-wrap">
                      <ConfirmButton
                        action={unbanUser.bind(null, b.user_id, false)}
                        confirmMessage={`이 사용자의 차단을 풀까요?\n${b.email ?? ''}\n\n(누적 신고 기록은 유지됩니다)`}
                        className="px-3 py-1 text-xs font-bold bg-bg border border-border hover:bg-white/5 text-white rounded"
                      >
                        차단 해제
                      </ConfirmButton>
                      <ConfirmButton
                        action={unbanUser.bind(null, b.user_id, true)}
                        confirmMessage={`이 사용자를 완전 복구할까요?\n${b.email ?? ''}\n\n⚠️ 누적 신고 기록도 함께 초기화됩니다.\n부당 차단으로 판단될 때만 사용하세요.`}
                        className="px-3 py-1 text-xs font-bold bg-primary/20 border border-primary/40 hover:bg-primary/30 text-primary rounded"
                      >
                        완전 복구
                      </ConfirmButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-xs text-white/40 space-y-1">
        <p>⚠️ <strong>차단 해제</strong>: 발송 제한만 풀고, 누적 신고 기록은 유지합니다. 같은 사용자가 다시 신고 누적되면 자동 재차단됩니다.</p>
        <p>⚠️ <strong>완전 복구</strong>: 발송 제한 + 신고 기록 모두 초기화. 부당 차단 시에만 사용하세요.</p>
      </div>
    </div>
  );
}