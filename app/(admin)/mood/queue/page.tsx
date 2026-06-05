import { createMoodClient } from '@/lib/supabase-mood-server';
import ConfirmButton from '../reports/confirm-button';
import { resolveReview } from './actions';

type QueueItem = {
  queue_id: string;
  reply_id: string;
  sender_id: string;
  sender_email: string | null;
  content: string;
  flagged_reason: string;
  status: string;
  reviewer_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  is_banned: boolean;
};

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: '검토 대기', color: 'bg-yellow-500/20 text-yellow-400' },
  ok: { label: '문제없음', color: 'bg-green-500/20 text-green-400' },
  bad: { label: '부적절 (조치됨)', color: 'bg-red-500/20 text-red-400' },
};

export default async function MoodQueuePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status || 'pending';
  const supabase = createMoodClient();

  // 탭 카운트용 — pending 카운트만 헤더에 노출
  const [queueResp, pendingCountResp] = await Promise.all([
    supabase.rpc('admin_list_review_queue', { p_status: status, p_limit: 100 }),
    supabase.rpc('admin_list_review_queue', { p_status: 'pending', p_limit: 100 }),
  ]);

  const rows = (queueResp.data ?? []) as QueueItem[];
  const error = queueResp.error;
  const pendingCount = (pendingCountResp.data ?? []).length;

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black mb-1">무드 · 검토 큐</h1>
          <p className="text-sm text-white/50">
            자동 감지된 의심 패턴 위로들 · 검토 후 문제없음 / 부적절로 처리해 주세요
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="text-right">
            <p className="text-xs text-white/40">검토 대기</p>
            <p className="text-2xl font-black text-yellow-400">{pendingCount}</p>
          </div>
        )}
      </header>

      {/* 상태 탭 */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'ok', 'bad', 'all'] as const).map((s) => (
          <a
            key={s}
            href={`/mood/queue?status=${s}`}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              status === s
                ? 'bg-primary text-bg'
                : 'bg-bgCard hover:bg-white/5 text-white/70'
            }`}
          >
            {s === 'pending'
              ? '검토 대기'
              : s === 'ok'
              ? '문제없음'
              : s === 'bad'
              ? '부적절'
              : '전체'}
          </a>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          불러오기 실패: {error.message}
        </div>
      )}

      {!error && rows.length === 0 ? (
        <div className="bg-bgCard border border-border rounded-2xl py-16 text-center text-white/40 text-sm">
          {status === 'pending'
            ? '검토 대기 중인 항목이 없어요 — 깨끗해요 ✨'
            : '해당 상태의 항목이 없어요'}
        </div>
      ) : (
        <div className="bg-bgCard border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg/50 text-xs text-white/50 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">발신자</th>
                <th className="px-4 py-3 text-left">위로 내용</th>
                <th className="px-4 py-3 text-left">감지 사유</th>
                <th className="px-4 py-3 text-center">상태</th>
                <th className="px-4 py-3 text-left">시간</th>
                <th className="px-4 py-3 text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => {
                const info = STATUS_LABEL[q.status] ?? {
                  label: q.status,
                  color: 'bg-gray-500/20 text-gray-400',
                };
                const isPending = q.status === 'pending';

                return (
                  <tr
                    key={q.queue_id}
                    className="border-t border-border hover:bg-white/5 align-top"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold break-all">
                        {q.sender_email || (
                          <span className="text-white/30">—</span>
                        )}
                      </div>
                      <div className="text-xs text-white/30 font-mono mt-0.5">
                        {q.sender_id.slice(0, 8)}…
                      </div>
                      {q.is_banned && (
                        <div className="mt-1">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-500/20 text-gray-400">
                            차단됨
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {q.content}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <span className="text-sm text-yellow-400">
                        {q.flagged_reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${info.color}`}
                      >
                        {info.label}
                      </span>
                      {q.reviewed_at && (
                        <div className="text-[10px] text-white/30 mt-1 whitespace-nowrap">
                          {new Date(q.reviewed_at).toLocaleString('ko-KR', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/50 whitespace-nowrap">
                      {new Date(q.created_at).toLocaleString('ko-KR', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {isPending ? (
                        <div className="flex gap-2 justify-end flex-wrap">
                          <ConfirmButton
                            action={resolveReview.bind(
                              null,
                              q.queue_id,
                              'ok',
                              null,
                            )}
                            confirmMessage={`이 위로를 "문제없음"으로 처리할까요?\n\n위로는 그대로 유지되고 큐에서만 빠집니다.\n\n"${q.content.slice(0, 60)}${q.content.length > 60 ? '…' : ''}"`}
                            className="px-3 py-1 text-xs font-bold bg-bg border border-border hover:bg-white/5 text-white rounded"
                          >
                            문제없음
                          </ConfirmButton>
                          <ConfirmButton
                            action={resolveReview.bind(
                              null,
                              q.queue_id,
                              'bad',
                              null,
                            )}
                            confirmMessage={`이 위로를 "부적절"로 처리할까요?\n\n⚠️ 위로가 영구 삭제되고\n⚠️ 발신자(${q.sender_email ?? ''})가 즉시 발송 차단됩니다.\n\n"${q.content.slice(0, 60)}${q.content.length > 60 ? '…' : ''}"`}
                            className="px-3 py-1 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded"
                          >
                            부적절
                          </ConfirmButton>
                        </div>
                      ) : (
                        <span className="text-xs text-white/30">처리됨</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-xs text-white/40 space-y-1">
        <p>ℹ️ <strong>검토 큐</strong>: 명백한 차단 사유는 아니지만 의심되는 패턴(빈정거림·반어법·강요 등)이 감지된 위로들입니다. 위로는 일단 정상 발송되었고, admin 판단으로 사후 조치합니다.</p>
        <p>ℹ️ <strong>부적절 처리</strong>: 위로를 영구 삭제하고 발신자를 즉시 발송 차단합니다. 차단 해제는 차단 유저 페이지에서 가능합니다.</p>
      </div>
    </div>
  );
}