'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_message_id: string | null;
  reported_room_id: string | null;
  report_type: string;
  reason: string;
  description: string | null;
  content_snapshot: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  review_note: string | null;
  reporter?: { nickname: string | null; avatar_url: string | null };
  reported?: { nickname: string | null; avatar_url: string | null };
}

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

const TYPE_LABELS: Record<string, string> = {
  user: '사용자',
  message: '메시지',
  room: '채팅방',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '대기 중', color: 'bg-yellow-500/20 text-yellow-400' },
  resolved: { label: '처리됨', color: 'bg-green-500/20 text-green-400' },
  rejected: { label: '반려', color: 'bg-gray-500/20 text-gray-400' },
};

export default function ReportsClient({
  reports,
  counts,
  currentStatus,
  currentType,
  error,
}: {
  reports: Report[];
  counts: { all: number; pending: number; resolved: number; rejected: number };
  currentStatus: string;
  currentType: string;
  error?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const supabase = createClient();

  const updateFilter = (key: 'status' | 'type', value: string) => {
    const params = new URLSearchParams();
    params.set('status', key === 'status' ? value : currentStatus);
    params.set('type', key === 'type' ? value : currentType);
    startTransition(() => {
      router.push(`/reports?${params.toString()}`);
    });
  };

  async function handleProcess(reportId: string, newStatus: 'resolved' | 'rejected') {
    setProcessing(true);
    try {
      const { error: updateError } = await supabase
        .from('kyorangtalk_reports')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          review_note: reviewNote.trim() || null,
        })
        .eq('id', reportId);

      if (updateError) {
        alert('처리 실패: ' + updateError.message);
        setProcessing(false);
        return;
      }

      setSelectedReport(null);
      setReviewNote('');
      router.refresh();
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black mb-1">신고 관리</h1>
        <p className="text-sm text-white/50">
          사용자/메시지/채팅방 신고를 검토하고 처리하세요
        </p>
      </header>

      {/* 상태 탭 */}
      <div className="flex gap-2 mb-4">
        {(['pending', 'resolved', 'rejected', 'all'] as const).map((s) => (
          <button
            key={s}
            onClick={() => updateFilter('status', s)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              currentStatus === s
                ? 'bg-primary text-bg'
                : 'bg-bgCard hover:bg-white/5 text-white/70'
            }`}
          >
            {s === 'pending'
              ? '대기 중'
              : s === 'resolved'
              ? '처리됨'
              : s === 'rejected'
              ? '반려'
              : '전체'}
            <span className="ml-2 text-xs opacity-70">
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* 타입 필터 */}
      <div className="flex gap-2 mb-6">
        {(['all', 'user', 'message', 'room'] as const).map((t) => (
          <button
            key={t}
            onClick={() => updateFilter('type', t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              currentType === t
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-transparent border-border text-white/50 hover:border-white/30'
            }`}
          >
            {t === 'all' ? '모든 종류' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          오류: {error}
        </div>
      )}

      {/* 신고 목록 */}
      <div className="bg-bgCard border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-bg/50 text-xs text-white/50 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">상태</th>
              <th className="px-4 py-3 text-left">종류</th>
              <th className="px-4 py-3 text-left">사유</th>
              <th className="px-4 py-3 text-left">신고자</th>
              <th className="px-4 py-3 text-left">피신고자</th>
              <th className="px-4 py-3 text-left">시간</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-white/40 text-sm">
                  신고 내역이 없어요
                </td>
              </tr>
            ) : (
              reports.map((r) => {
                const statusInfo = STATUS_LABELS[r.status];
                return (
                  <tr
                    key={r.id}
                    onClick={() => {
                      setSelectedReport(r);
                      setReviewNote(r.review_note || '');
                    }}
                    className="border-t border-border hover:bg-white/5 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {TYPE_LABELS[r.report_type] || r.report_type}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {REASON_LABELS[r.reason] || r.reason}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {r.reporter?.nickname || (
                        <span className="text-white/30">탈퇴</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {r.reported?.nickname || (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/50">
                      {new Date(r.created_at).toLocaleString('ko-KR', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 상세 모달 */}
      {selectedReport && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="bg-bgCard border border-border rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold mb-1">신고 상세</h2>
                <p className="text-xs text-white/40 font-mono">
                  {selectedReport.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/40 mb-1">종류</p>
                  <p className="font-semibold">
                    {TYPE_LABELS[selectedReport.report_type]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">사유</p>
                  <p className="font-semibold">
                    {REASON_LABELS[selectedReport.reason]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">신고자</p>
                  <p className="font-semibold">
                    {selectedReport.reporter?.nickname || '—'}
                  </p>
                  <p className="text-xs text-white/30 font-mono mt-0.5">
                    {selectedReport.reporter_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">피신고자</p>
                  <p className="font-semibold">
                    {selectedReport.reported?.nickname || '—'}
                  </p>
                  <p className="text-xs text-white/30 font-mono mt-0.5">
                    {selectedReport.reported_user_id || '—'}
                  </p>
                </div>
              </div>

              {selectedReport.description && (
                <div>
                  <p className="text-xs text-white/40 mb-1">신고자 설명</p>
                  <div className="p-3 bg-bg border border-border rounded-lg text-sm">
                    {selectedReport.description}
                  </div>
                </div>
              )}

              {selectedReport.content_snapshot && (
                <div>
                  <p className="text-xs text-white/40 mb-1">
                    신고 시점 콘텐츠 스냅샷
                  </p>
                  <div className="p-3 bg-bg border border-red-500/20 rounded-lg text-sm whitespace-pre-wrap">
                    {selectedReport.content_snapshot}
                  </div>
                </div>
              )}

              {selectedReport.reported_room_id && (
                <div>
                  <p className="text-xs text-white/40 mb-1">관련 채팅방</p>
                  <p className="text-xs font-mono text-white/60">
                    {selectedReport.reported_room_id}
                  </p>
                </div>
              )}

              {selectedReport.status === 'pending' ? (
                <>
                  <div>
                    <p className="text-xs text-white/40 mb-1">처리 메모 (선택)</p>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      rows={3}
                      placeholder="처리 사유, 추가 조치 등을 기록"
                      className="w-full p-3 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleProcess(selectedReport.id, 'rejected')}
                      disabled={processing}
                      className="flex-1 py-3 bg-bg border border-border hover:bg-white/5 disabled:opacity-50 rounded-lg text-sm font-bold"
                    >
                      반려 (위반 없음)
                    </button>
                    <button
                      onClick={() => handleProcess(selectedReport.id, 'resolved')}
                      disabled={processing}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg text-sm font-bold"
                    >
                      처리 완료
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-3 bg-bg border border-border rounded-lg">
                  <p className="text-xs text-white/40 mb-1">
                    처리 일시 ·{' '}
                    {selectedReport.reviewed_at &&
                      new Date(selectedReport.reviewed_at).toLocaleString('ko-KR')}
                  </p>
                  {selectedReport.review_note && (
                    <p className="text-sm mt-2">{selectedReport.review_note}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
