import { createMoodClient } from '@/lib/supabase-mood-server';
import UsersClient from './users-client';

export const dynamic = 'force-dynamic';

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

export default async function MoodUsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createMoodClient();
  const q = searchParams.q ?? '';

  const { data, error } = await supabase.rpc('admin_mood_user_list', {
    p_query: q,
    p_limit: 50,
  });

  const users = (data ?? []) as UserRow[];

  return (
    <UsersClient
      users={users}
      currentQuery={q}
      error={error?.message}
    />
  );
}