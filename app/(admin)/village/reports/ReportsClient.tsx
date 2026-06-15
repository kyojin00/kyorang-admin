'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  dismissReport,
  deleteReportTarget,
  banUserFromReport,
  unbanUser,
} from '@/lib/admin-village';
import type { VillageReportRow } from './page';

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'pending', label: '미처리' },
  { value: 'resolved', label: '조치 완료' },
  { value: 'dismissed', label: '무혐의' },
  { value: 'all', label: '전체' },
];

export default function ReportsClient({
  rows,
  currentStatus,
  pendingCount,
}: {
  rows: VillageReportRow[];
  currentStatus: string;
  pendingCount: number;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">교랑빌리지 신고 관리</h1>
          <p className="text-sm text-white/50 mt-1">
            미처리 {pendingCount}건
          </p>
        </div>
      </div>

      {/* 상태 탭 */}
      <div className="flex gap-2 mb-6">
        {STATUS_TABS.map((tab) => {
          const active = currentStatus === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/village/reports?status=${tab.value}`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                active
                  ? 'bg-primary/20 text-primary'
                  : 'bg-bgCard text-white/60 hover:text-white border border-border'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* 목록 */}
      {rows.length === 0 ? (
        <div className="bg-bgCard border border-border rounded-2xl p-12 text-center text-white/40">
          해당 상태의 신고가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <ReportRow key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportRow({ row }: { row: VillageReportRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : '처리에 실패했습니다.');
      }
    });
  }

  const { target } = row;
  const canDeleteContent = ['post', 'comment', 'message', 'village'].includes(
    target.type,
  );
  const hasUser = !!target.authorId;

  return (
    <div className="bg-bgCard border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-primary/15 text-primary">
              {target.label}
            </span>
            <StatusBadge status={row.status} />
            <span className="text-xs text-white/40">
              {formatDate(row.created_at)}
            </span>
          </div>

          <p className="text-sm text-white/80 mb-2">
            <span className="text-white/40">사유: </span>
            {row.reason}
          </p>

          {row.reporter_nickname && (
            <p className="text-xs text-white/40 mb-3">
              신고자: {row.reporter_nickname}
            </p>
          )}

          {/* 신고 대상 미리보기 */}
          <div className="bg-bg border border-border rounded-lg p-3 mt-2">
            {target.authorNickname && (
              <p className="text-xs text-white/50 mb-1">
                {target.authorNickname}
                {target.authorIsBanned && (
                  <span className="ml-2 text-red-400">[정지됨]</span>
                )}
              </p>
            )}
            <p className="text-sm text-white/80 whitespace-pre-wrap break-words">
              {target.preview || '(내용 없음)'}
            </p>
          </div>
        </div>
      </div>

      {row.status === 'pending' ? (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
          <button
            disabled={pending}
            onClick={() =>
              run(() => dismissReport(row.id, '검토 결과 문제 없음'))
            }
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50"
          >
            무혐의
          </button>

          {canDeleteContent && (
            <button
              disabled={pending}
              onClick={() => {
                if (!confirm('이 콘텐츠를 삭제할까요? 되돌릴 수 없습니다.'))
                  return;
                run(() =>
                  deleteReportTarget(row.id, target.type, target.id, '신고에 의한 삭제'),
                );
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 disabled:opacity-50"
            >
              콘텐츠 삭제
            </button>
          )}

          {hasUser && !target.authorIsBanned && (
            <button
              disabled={pending}
              onClick={() => {
                if (
                  !confirm(
                    `${target.authorNickname ?? '이 사용자'}를 정지할까요?`,
                  )
                )
                  return;
                run(() =>
                  banUserFromReport(row.id, target.type, target.id, row.reason),
                );
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 disabled:opacity-50"
            >
              사용자 정지
            </button>
          )}

          {target.type === 'user' && target.authorIsBanned && (
            <button
              disabled={pending}
              onClick={() => {
                if (!confirm('이 사용자의 정지를 해제할까요?')) return;
                run(() => unbanUser(target.id));
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 disabled:opacity-50"
            >
              정지 해제
            </button>
          )}
        </div>
      ) : (
        <div className="pt-3 border-t border-border text-xs text-white/40">
          {row.resolved_at && (
            <span>처리 시각: {formatDate(row.resolved_at)}</span>
          )}
          {row.resolution_note && (
            <span className="ml-3">메모: {row.resolution_note}</span>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-400">⚠ {error}</p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: '미처리', cls: 'bg-amber-500/15 text-amber-300' },
    resolved: { label: '조치 완료', cls: 'bg-green-500/15 text-green-400' },
    dismissed: { label: '무혐의', cls: 'bg-white/10 text-white/60' },
  };
  const m = map[status] ?? { label: status, cls: 'bg-white/10 text-white/60' };
  return (
    <span
      className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${m.cls}`}
    >
      {m.label}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${hh}:${mm}`;
}