import { createClient } from '@/lib/supabase/server'
import { deleteReply, banUser, unbanUser } from './actions'
import ConfirmButton from './confirm-button'

// admin_list_reported_replies 의 반환 행 타입
type ReportedReply = {
  reply_id: string
  sender_id: string
  sender_email: string | null
  requester_id: string
  content: string
  template_id: string
  reply_created: string
  report_count: number
  last_reported: string
  is_banned: boolean
}

export const dynamic = 'force-dynamic'

export default async function ReportedRepliesPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_list_reported_replies', {
    p_limit: 100,
  })

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">신고된 위로</h1>
        <div className="mt-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm">
          불러오기 실패: {error.message}
        </div>
      </div>
    )
  }

  const rows = (data ?? []) as ReportedReply[]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-2">
        <h1 className="text-2xl font-bold">신고된 위로</h1>
        <a
          href="/mood/bans"
          className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2"
        >
          차단 유저 목록 →
        </a>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        서로 다른 신고자 누적 3건 이상이면 자동 차단됩니다. 부당 차단은 차단 해제로 풀어주세요.
        위로 삭제는 영구적이며 동반 신고도 함께 제거됩니다.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-gray-400">
          신고된 위로가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">발신자</th>
                <th className="px-3 py-2 text-left font-medium">위로 내용</th>
                <th className="px-3 py-2 text-center font-medium">신고수</th>
                <th className="px-3 py-2 text-left font-medium">마지막 신고</th>
                <th className="px-3 py-2 text-center font-medium">상태</th>
                <th className="px-3 py-2 text-right font-medium">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.reply_id} className="hover:bg-gray-50 align-top">
                  <td className="px-3 py-3">
                    <div className="font-medium text-gray-900 break-all">
                      {r.sender_email ?? '(이메일 없음)'}
                    </div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">
                      {r.sender_id.slice(0, 8)}…
                    </div>
                  </td>
                  <td className="px-3 py-3 max-w-md">
                    <div className="whitespace-pre-wrap break-words text-gray-800">
                      {r.content}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      템플릿: {r.template_id}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-block min-w-[28px] px-2 py-1 rounded bg-red-100 text-red-700 font-bold">
                      {r.report_count}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                    {new Date(r.last_reported).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {r.is_banned ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-800 text-white">
                        차단됨
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                        활성
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2 justify-end flex-wrap">
                      <ConfirmButton
                        action={deleteReply.bind(null, r.reply_id)}
                        confirmMessage={`이 위로를 삭제할까요?\n\n"${r.content.slice(0, 60)}${
                          r.content.length > 60 ? '…' : ''
                        }"`}
                        className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        위로 삭제
                      </ConfirmButton>
                      {r.is_banned ? (
                        <ConfirmButton
                          action={unbanUser.bind(null, r.sender_id, false)}
                          confirmMessage={`이 사용자의 차단을 풀까요?\n${r.sender_email ?? ''}\n\n(누적 신고 기록은 유지됩니다)`}
                          className="px-3 py-1 text-xs font-medium bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        >
                          차단 해제
                        </ConfirmButton>
                      ) : (
                        <ConfirmButton
                          action={banUser.bind(
                            null,
                            r.sender_id,
                            'admin 수동 차단'
                          )}
                          confirmMessage={`이 사용자를 발송 차단할까요?\n${r.sender_email ?? ''}`}
                          className="px-3 py-1 text-xs font-medium bg-gray-800 text-white rounded hover:bg-gray-900"
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
    </div>
  )
}
