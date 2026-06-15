'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import { createVillageAdminClient } from '@/lib/supabase-village-server';
import { isAdmin } from '@/lib/admin';

/**
 * 교랑빌리지 어드민 액션
 *
 * 권한 모델:
 * - kyorang-admin은 교랑톡 어드민(isAdmin)이 로그인한 상태로 운영된다.
 * - 따라서 빌리지 액션 직전에 교랑톡 어드민 여부만 한 번 확인하면 충분.
 * - 빌리지 자체에는 별도 어드민 세션을 두지 않고 service_role로 처리한다.
 */

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    throw new Error('관리자 권한이 없습니다.');
  }
  return user;
}

// ===========================================================
// 조치 액션
// ===========================================================

/// 신고를 무혐의로 종결
export async function dismissReport(reportId: string, note?: string) {
  await requireAdmin();
  const admin = createVillageAdminClient();

  const { error } = await admin
    .from('reports')
    .update({
      status: 'dismissed',
      resolved_at: new Date().toISOString(),
      resolution_note: note ?? null,
    })
    .eq('id', reportId);

  if (error) throw new Error(error.message);
  revalidatePath('/village/reports');
  return { ok: true };
}

/// 신고 대상 콘텐츠 삭제 (post/comment/message/village)
export async function deleteReportTarget(
  reportId: string,
  targetType: string,
  targetId: string,
  note?: string,
) {
  await requireAdmin();
  const admin = createVillageAdminClient();

  switch (targetType) {
    case 'post':
      await admin.from('posts').delete().eq('id', targetId);
      break;
    case 'comment':
      await admin.from('comments').delete().eq('id', targetId);
      break;
    case 'message':
      // 마을 채팅 또는 DM 둘 다 시도
      await admin.from('village_messages').delete().eq('id', targetId);
      await admin.from('dm_messages').delete().eq('id', targetId);
      break;
    case 'village':
      await admin.from('villages').delete().eq('id', targetId);
      break;
    default:
      throw new Error('이 신고 대상은 콘텐츠 삭제로 처리할 수 없습니다.');
  }

  await admin
    .from('reports')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolution_note: note ?? null,
    })
    .eq('id', reportId);

  revalidatePath('/village/reports');
  return { ok: true };
}

/// 사용자 정지 (target이 user거나 콘텐츠 작성자)
export async function banUserFromReport(
  reportId: string,
  targetType: string,
  targetId: string,
  reason: string,
) {
  await requireAdmin();
  const admin = createVillageAdminClient();

  const userId = await resolveUserIdFromTarget(targetType, targetId);
  if (!userId) {
    throw new Error('정지할 사용자를 찾을 수 없습니다.');
  }

  await admin
    .from('profiles')
    .update({
      is_banned: true,
      banned_at: new Date().toISOString(),
      banned_reason: reason,
    })
    .eq('id', userId);

  await admin
    .from('reports')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolution_note: reason,
    })
    .eq('id', reportId);

  revalidatePath('/village/users');
  revalidatePath('/village/reports');
  return { ok: true, user_id: userId };
}

/// 사용자 정지 해제
export async function unbanUser(userId: string) {
  await requireAdmin();
  const admin = createVillageAdminClient();

  const { error } = await admin
    .from('profiles')
    .update({
      is_banned: false,
      banned_at: null,
      banned_reason: null,
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);

  revalidatePath('/village/users');
  revalidatePath('/village/reports');
  return { ok: true };
}

// ===========================================================
// 헬퍼
// ===========================================================

async function resolveUserIdFromTarget(
  targetType: string,
  targetId: string,
): Promise<string | null> {
  const admin = createVillageAdminClient();

  switch (targetType) {
    case 'user':
      return targetId;
    case 'post': {
      const { data } = await admin
        .from('posts')
        .select('author_id')
        .eq('id', targetId)
        .maybeSingle();
      return data?.author_id ?? null;
    }
    case 'comment': {
      const { data } = await admin
        .from('comments')
        .select('author_id')
        .eq('id', targetId)
        .maybeSingle();
      return data?.author_id ?? null;
    }
    case 'message': {
      const vm = await admin
        .from('village_messages')
        .select('sender_id')
        .eq('id', targetId)
        .maybeSingle();
      if (vm.data?.sender_id) return vm.data.sender_id;
      const dm = await admin
        .from('dm_messages')
        .select('sender_id')
        .eq('id', targetId)
        .maybeSingle();
      return dm.data?.sender_id ?? null;
    }
    case 'village': {
      const { data } = await admin
        .from('villages')
        .select('owner_id')
        .eq('id', targetId)
        .maybeSingle();
      return data?.owner_id ?? null;
    }
    default:
      return null;
  }
}