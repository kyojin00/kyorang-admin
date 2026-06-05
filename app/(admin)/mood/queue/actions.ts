'use server';

import { createMoodClient } from '@/lib/supabase-mood-server';
import { revalidatePath } from 'next/cache';

/**
 * 검토 큐 항목을 처리한다.
 * - 'ok': 문제없음으로 처리, 위로는 그대로 유지
 * - 'bad': 부적절로 처리, 위로 영구 삭제 + 발신자 즉시 발송 차단
 *
 * 인가는 admin_resolve_review RPC 내부 is_admin() 가 책임진다.
 */
export async function resolveReview(
  queueId: string,
  action: 'ok' | 'bad',
  note: string | null = null,
): Promise<void> {
  const supabase = createMoodClient();
  const { error } = await supabase.rpc('admin_resolve_review', {
    p_queue_id: queueId,
    p_action: action,
    p_note: note,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/mood/queue');
  revalidatePath('/mood/reports');
  revalidatePath('/mood/bans');
}