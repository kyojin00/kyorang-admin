/**
 * 관리자 user_id 화이트리스트
 */
export const ADMIN_USER_IDS = (
  process.env.NEXT_PUBLIC_ADMIN_USER_IDS || ''
)
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return ADMIN_USER_IDS.includes(userId);
}
