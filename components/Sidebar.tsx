'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

const talkMenus = [
  { href: '/reports', label: '신고 관리', icon: '🚩' },
  { href: '/users', label: '사용자', icon: '👥' },
  { href: '/stats', label: '통계', icon: '📊' },
];

const moodMenus = [
  { href: '/mood/reports', label: '신고된 위로', icon: '🚩' },
  { href: '/mood/bans', label: '차단 유저', icon: '🚫' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  }

  return (
    <aside className="w-60 bg-bgCard border-r border-border min-h-screen p-4 flex flex-col">
      <div className="mb-8 px-2">
        <h1 className="text-lg font-black">교랑</h1>
        <p className="text-xs text-white/40 mt-1">관리자 대시보드</p>
      </div>

      <nav className="flex-1 space-y-6">
        {/* 교랑톡 섹션 */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] uppercase tracking-wider text-white/30 font-bold mb-2">
            교랑톡
          </p>
          {talkMenus.map((menu) => {
            const isActive =
              pathname === menu.href ||
              (menu.href !== '/' && pathname.startsWith(menu.href + '/'));
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <span>{menu.icon}</span>
                <span>{menu.label}</span>
              </Link>
            );
          })}
        </div>

        {/* 교랑무드 섹션 */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] uppercase tracking-wider text-white/30 font-bold mb-2">
            교랑무드
          </p>
          {moodMenus.map((menu) => {
            const isActive =
              pathname === menu.href || pathname.startsWith(menu.href + '/');
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <span>{menu.icon}</span>
                <span>{menu.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <button
        onClick={handleLogout}
        className="px-3 py-2.5 text-sm text-white/50 hover:text-white text-left rounded-lg hover:bg-white/5 transition-colors"
      >
        로그아웃
      </button>
    </aside>
  );
}