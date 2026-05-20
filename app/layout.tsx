import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '교랑톡 관리자',
  description: '교랑톡 신고/사용자 관리 대시보드',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-bg text-white min-h-screen">{children}</body>
    </html>
  );
}
