/**
 * 무드 프로젝트 admin user_id 화이트리스트.
 * 톡 admin (NEXT_PUBLIC_ADMIN_USER_IDS) 과 별개로 관리한다 —
 * 두 프로젝트의 user_id 가 다르기 때문.
 */
export const MOOD_ADMIN_USER_IDS = (
  process.env.NEXT_PUBLIC_ADMIN_USER_IDS_MOOD || ''
)
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

export function isMoodAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return MOOD_ADMIN_USER_IDS.includes(userId);
}