'use server';

import { createMoodClient } from '@/lib/supabase-mood-server';
import { revalidatePath } from 'next/cache';

/**
 * 신고된 위로를 영구 삭제한다. 동반 신고 기록도 cascade 로 정리.
 * 무드 프로젝트의 is_admin() 가 auth.uid() 로 인가하므로
 * createMoodClient (무드 쿠키 세션) 를 사용.
 */
export async function deleteReply(replyId: string): Promise<void> {
  const supabase = createMoodClient();
  const { error } = await supabase.rpc('admin_delete_reply', {
    p_reply_id: replyId,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/mood/reports');
  revalidatePath('/mood/bans');
}

/**
 * 사용자를 수동 발송 차단한다.
 */
export async function banUser(
  userId: string,
  reason?: string,
): Promise<void> {
  const supabase = createMoodClient();
  const { error } = await supabase.rpc('admin_ban_user', {
    p_user_id: userId,
    p_reason: reason ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/mood/reports');
  revalidatePath('/mood/bans');
}

/**
 * 사용자 차단을 해제한다.
 * @param clearReports true 면 누적 신고 기록도 함께 초기화(부당 차단 복구용).
 */
export async function unbanUser(
  userId: string,
  clearReports: boolean = false,
): Promise<void> {
  const supabase = createMoodClient();
  const { error } = await supabase.rpc('admin_unban_user', {
    p_user_id: userId,
    p_clear_reports: clearReports,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/mood/reports');
  revalidatePath('/mood/bans');
}