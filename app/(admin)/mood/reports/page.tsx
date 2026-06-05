import { createMoodClient } from '@/lib/supabase-mood-server';
import ConfirmButton from './confirm-button';
import { deleteReply, banUser, unbanUser } from './actions';

type ReportedReply = {
  reply_id: string;
  sender_id: string;
  sender_email: string | null;
  requester_id: string;
  content: string;
  template_id: string;
  reply_created: string;
  report_count: number;
  last_reported: string;
  is_banned: boolean;
};

export const dynamic = 'force-dynamic';

export default async function MoodReportsPage() {
  // ⭐ 무드 프로젝트 전용 클라이언트.
  // is_admin() 가 무드 프로젝트의 auth.uid() 로 인가하므로 무드 세션 쿠키가 필수.
  const supabase = createMoodClient();

  const { data, error } = await supabase.rpc('admin_list_reported_replies', {
    p_limit: 100,
  });

  const rows = (data ?? []) as ReportedReply[];

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black mb-1">무드 · 신고된 위로</h1>
          <p className="text-sm text-white/50">
            익명 위로 풀에서 신고된 위로 목록 · 서로 다른 신고자 3건 이상 누적 시 자동 차단
          </p>
        </div>
        <a
          href="/mood/bans"
          className="text-sm text-white/50 hover:text-white underline underline-offset-2"
        >
          차단 유저 →
        </a>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          불러오기 실패: {error.message}
        </div>
      )}

      {!error && rows.length === 0 ? (
        <div className="bg-bgCard border border-border rounded-2xl py-16 text-center text-white/40 text-sm">
          신고된 위로가 없어요
        </div>
      ) : (
        <div className="bg-bgCard border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg/50 text-xs text-white/50 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">발신자</th>
                <th className="px-4 py-3 text-left">위로 내용</th>
                <th className="px-4 py-3 text-center">신고수</th>
                <th className="px-4 py-3 text-left">마지막 신고</th>
                <th className="px-4 py-3 text-center">상태</th>
                <th className="px-4 py-3 text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.reply_id}
                  className="border-t border-border hover:bg-white/5 align-top"
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold break-all">
                      {r.sender_email || (
                        <span className="text-white/30">—</span>
                      )}
                    </div>
                    <div className="text-xs text-white/30 font-mono mt-0.5">
                      {r.sender_id.slice(0, 8)}…
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-md">
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {r.content}
                    </div>
                    <div className="text-xs text-white/30 mt-1">
                      템플릿: {r.template_id}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block min-w-[28px] px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-bold">
                      {r.report_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/50 whitespace-nowrap">
                    {new Date(r.last_reported).toLocaleString('ko-KR', {
                      year: '2-digit',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.is_banned ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-gray-500/20 text-gray-400">
                        차단됨
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400">
                        활성
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end flex-wrap">
                      <ConfirmButton
                        action={deleteReply.bind(null, r.reply_id)}
                        confirmMessage={`이 위로를 삭제할까요?\n\n"${r.content.slice(
                          0,
                          60,
                        )}${r.content.length > 60 ? '…' : ''}"`}
                        className="px-3 py-1 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded"
                      >
                        위로 삭제
                      </ConfirmButton>
                      {r.is_banned ? (
                        <ConfirmButton
                          action={unbanUser.bind(null, r.sender_id, false)}
                          confirmMessage={`이 사용자의 차단을 풀까요?\n${r.sender_email ?? ''}\n\n(누적 신고 기록은 유지됩니다)`}
                          className="px-3 py-1 text-xs font-bold bg-bg border border-border hover:bg-white/5 text-white rounded"
                        >
                          차단 해제
                        </ConfirmButton>
                      ) : (
                        <ConfirmButton
                          action={banUser.bind(
                            null,
                            r.sender_id,
                            'admin 수동 차단',
                          )}
                          confirmMessage={`이 사용자를 발송 차단할까요?\n${r.sender_email ?? ''}`}
                          className="px-3 py-1 text-xs font-bold bg-bg border border-border hover:bg-white/5 text-white rounded"
                        >
                          수동 차단
                        </ConfirmButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-white/40">
        ⚠️ 위로 삭제는 영구적이며 동반 신고 기록도 cascade 로 함께 정리됩니다
      </p>
    </div>
  );
}