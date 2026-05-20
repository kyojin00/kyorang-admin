'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  created_at: string;
  status_message: string | null;
  report_count: number;
  block_count: number;
}

export default function UsersClient({
  users,
  currentQuery,
  error,
}: {
  users: User[];
  currentQuery: string;
  error?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(currentQuery);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      router.push(`/users?q=${encodeURIComponent(query.trim())}`);
    });
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black mb-1">사용자 관리</h1>
        <p className="text-sm text-white/50">
          닉네임으로 검색하고, 신고/차단 누적 사용자를 확인하세요
        </p>
      </header>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="닉네임 검색"
          className="flex-1 px-4 py-2.5 bg-bgCard border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-primary hover:bg-primaryLight text-bg rounded-lg text-sm font-bold disabled:opacity-50"
        >
          {isPending ? '검색 중...' : '검색'}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          오류: {error}
        </div>
      )}

      <div className="bg-bgCard border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-bg/50 text-xs text-white/50 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">닉네임</th>
              <th className="px-4 py-3 text-left">상태 메시지</th>
              <th className="px-4 py-3 text-center">받은 신고</th>
              <th className="px-4 py-3 text-center">차단당한 수</th>
              <th className="px-4 py-3 text-left">가입일</th>
              <th className="px-4 py-3 text-left">ID</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-white/40 text-sm">
                  사용자가 없어요
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isRisky = u.report_count >= 3 || u.block_count >= 5;
                return (
                  <tr
                    key={u.id}
                    className={`border-t border-border hover:bg-white/5 ${
                      isRisky ? 'bg-red-500/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.avatar_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {(u.nickname || '?')[0]}
                          </div>
                        )}
                        <span className="font-semibold">
                          {u.nickname || (
                            <span className="text-white/30">—</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/60 max-w-[200px] truncate">
                      {u.status_message || (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.report_count > 0 ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            u.report_count >= 3
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {u.report_count}건
                        </span>
                      ) : (
                        <span className="text-white/30 text-sm">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.block_count > 0 ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            u.block_count >= 5
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-orange-500/20 text-orange-400'
                          }`}
                        >
                          {u.block_count}건
                        </span>
                      ) : (
                        <span className="text-white/30 text-sm">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/50">
                      {new Date(u.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-white/30">
                      {u.id.slice(0, 8)}...
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-white/40">
        ⚠️ 신고 3건 이상 또는 차단 5건 이상 사용자는 빨간색으로 표시됩니다
      </p>
    </div>
  );
}
