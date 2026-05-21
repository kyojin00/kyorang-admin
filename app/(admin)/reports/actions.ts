'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/admin';
import { revalidatePath } from 'next/cache';

/**
 * 신고 처리 (완료/반려)
 * 서버 액션으로 처리해서 service role 키 사용 → RLS 우회
 * 단, 호출자가 관리자인지 다시 검증
 */
export async function processReport({
  reportId,
  newStatus,
  reviewNote,
}: {
  reportId: string;
  newStatus: 'resolved' | 'rejected';
  reviewNote: string;
}) {
  // 1. 현재 사용자가 관리자인지 검증
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.id)) {
    return { success: false, error: '관리자 권한이 없습니다' };
  }

  // 2. service role 로 update (RLS 우회)
  const admin = createAdminClient();
  const { error } = await admin
    .from('kyorangtalk_reports')
    .update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote.trim() || null,
    })
    .eq('id', reportId);

  if (error) {
    return { success: false, error: error.message };
  }

  // 3. 페이지 재검증
  revalidatePath('/reports');
  return { success: true };
}