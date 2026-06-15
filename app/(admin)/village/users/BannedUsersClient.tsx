'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { unbanUser } from '@/lib/admin-village';
import type { BannedUserRow } from './page';

export default function BannedUsersClient({
  rows,
  error,
}: {
  rows: BannedUserRow[];
  error?: string;
}) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black">교랑빌리지 정지 사용자</h1>
        <p className="text-sm text-white/50 mt-1">
          현재 정지된 사용자 {rows.length}명
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="bg-bgCard border border-border rounded-2xl p-12 text-center text-white/40">
          현재 정지된 사용자가 없습니다.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <BannedRow key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function BannedRow({ row }: { row: BannedUserRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function handleUnban() {
    if (!confirm(`${row.nickname}님의 정지를 해제할까요?`)) return;
    setErr(null);
    startTransition(async () => {
      try {
        await unbanUser(row.id);
        router.refresh();
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : '정지 해제에 실패했습니다.');
      }
    });
  }

  return (
    <div className="bg-bgCard border border-border rounded-xl p-4 flex items-start gap-4">
      {row.avatar_url ? (
        <img
          src={row.avatar_url}
          alt=""
          className="w-10 h-10 rounded-full object-cover bg-white/10"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white/60">
          {row.nickname.charAt(0)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">{row.nickname}</span>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/15 text-red-400">
            정지됨
          </span>
        </div>
        <p className="text-xs text-white/50 mb-1">
          {row.banned_at ? `정지 시각: ${formatDate(row.banned_at)}` : ''}
        </p>
        {row.banned_reason && (
          <p className="text-xs text-white/70">
            사유: <span className="text-white/90">{row.banned_reason}</span>
          </p>
        )}
        <p className="text-[10px] text-white/30 mt-1 break-all">
          ID: {row.id}
        </p>
        {err && <p className="mt-2 text-xs text-red-400">⚠ {err}</p>}
      </div>

      <button
        disabled={pending}
        onClick={handleUnban}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 disabled:opacity-50 flex-shrink-0"
      >
        {pending ? '처리 중...' : '정지 해제'}
      </button>
    </div>
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