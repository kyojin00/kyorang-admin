'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type UserRow = {
  user_id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  requests_count: number;
  replies_count: number;
  received_reports: number;
  bad_review_count: number;
  is_banned: boolean;
};

export default function UsersClient({
  users,
  currentQuery,
  error,
}: {
  users: UserRow[];
  currentQuery: string;
  error?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(currentQuery);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      router.push(`/mood/users?q=${encodeURIComponent(query.trim())}`);
    });
  }

  function clearSearch() {
    setQuery('');
    startTransition(() => {
      router.push('/mood/users');
    });
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black mb-1">무드 · 사용자</h1>
        <p className="text-sm text-white/50">
          이메일로 검색하고, 활동량·신고 누적·위험 사용자를 한눈에 확인하세요
        </p>
      </header>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이메일 검색"
          className="flex-1 px-4 py-2.5 bg-bgCard border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-primary hover:bg-primaryLight text-bg rounded-lg text-sm font-bold disabled:opacity-50"
        >
          {isPending ? '검색 중…' : '검색'}
        </button>
        {currentQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="px-4 py-2.5 bg-bgCard border border-border hover:bg-white/5 text-white/70 rounded-lg text-sm"
          >
            초기화
          </button>
        )}
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
              <th className="px-4 py-3 text-left">이메일</th>
              <th className="px-4 py-3 text-center">요청</th>
              <th className="px-4 py-3 text-center">발송</th>
              <th className="px-4 py-3 text-center">받은 신고</th>
              <th className="px-4 py-3 text-center">검토 큐 부적절</th>
              <th className="px-4 py-3 text-center">상태</th>
              <th className="px-4 py-3 text-left">가입</th>
              <th className="px-4 py-3 text-left">최근 접속</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-white/40 text-sm"
                >
                  {currentQuery
                    ? `"${currentQuery}" 검색 결과가 없어요`
                    : '사용자가 없어요'}
                </td>
              </tr>
            ) : (
              users.map((u) => {
                // 위험 판정:
                //   - 차단됨
                //   - 누적 신고 2건 이상 (3건이면 자동 차단이므로 임박)
                //   - 검토 큐 bad 이력 1건 이상
                const isRisky =
                  u.is_banned ||
                  u.received_reports >= 2 ||
                  u.bad_review_count >= 1;

                return (
                  <tr
                    key={u.user_id}
                    className={`border-t border-border hover:bg-white/5 ${
                      isRisky ? 'bg-red-500/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold break-all">
                        {u.email || (
                          <span className="text-white/30">—</span>
                        )}
                      </div>
                      <div className="text-xs text-white/30 font-mono mt-0.5">
                        {u.user_id.slice(0, 8)}…
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CountCell value={u.requests_count} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CountCell value={u.replies_count} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.received_reports > 0 ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            u.received_reports >= 3
                              ? 'bg-red-500/30 text-red-300'
                              : u.received_reports >= 2
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {u.received_reports}건
                        </span>
                      ) : (
                        <span className="text-white/30 text-sm">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.bad_review_count > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400">
                          {u.bad_review_count}건
                        </span>
                      ) : (
                        <span className="text-white/30 text-sm">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.is_banned ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-gray-700 text-gray-300">
                          차단됨
                        </span>
                      ) : isRisky ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400">
                          주의
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400">
                          정상
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/50 whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/50 whitespace-nowrap">
                      {u.last_sign_in_at ? (
                        new Date(u.last_sign_in_at).toLocaleDateString(
                          'ko-KR',
                        )
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-white/40 space-y-1">
        <p>
          ⚠️ <strong>주의</strong> 상태: 받은 신고 2건 이상 또는 검토 큐 부적절 이력이 있는 사용자
        </p>
        <p>
          ⚠️ <strong>차단됨</strong> 상태: 발송 차단된 사용자. 차단 유저 페이지에서 해제 가능
        </p>
        <p>ℹ️ 최대 50명까지 표시됩니다. 검색으로 필터링하세요.</p>
      </div>
    </div>
  );
}

function CountCell({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-white/30 text-sm">0</span>;
  }
  return <span className="text-sm font-semibold">{value}</span>;
}