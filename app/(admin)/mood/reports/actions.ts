'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

/**
 * 신고된 위로를 영구 삭제한다. 동반 신고 기록도 cascade 로 정리됨.
 * 인가는 RPC 내부 is_admin() 가 책임진다(auth.uid() 기반).
 *
 * 쿠키 세션 클라이언트를 써야 auth.uid() 가 정상 전달되므로
 * createAdminClient (service_role) 은 사용하지 않는다.
 */
export async function deleteReply(replyId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc('admin_delete_reply', {
    p_reply_id: replyId,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/mood/reports');
  revalidatePath('/mood/bans');
}

/**
 * 사용자를 수동 발송 차단한다.
 * 누적 신고 임계(3건) 미달이어도 admin 판단으로 차단 가능.
 */
export async function banUser(
  userId: string,
  reason?: string,
): Promise<void> {
  const supabase = createClient();
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
  const supabase = createClient();
  const { error } = await supabase.rpc('admin_unban_user', {
    p_user_id: userId,
    p_clear_reports: clearReports,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/mood/reports');
  revalidatePath('/mood/bans');
}