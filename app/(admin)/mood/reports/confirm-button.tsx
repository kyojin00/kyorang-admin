'use client';

import { ReactNode, useState, useTransition } from 'react';

type Props = {
  /** bind 로 인자가 미리 채워진 server action */
  action: () => Promise<void>;
  /** confirm() 에 보여줄 메시지 */
  confirmMessage: string;
  className?: string;
  children: ReactNode;
};

/**
 * 확인 다이얼로그가 달린 액션 버튼.
 *
 * 서버 액션은 부모(서버 컴포넌트)에서 bind 로 인자를 채워 넘긴다.
 * 클릭 → confirm() → 액션 호출 → 실패 시 alert.
 * useTransition 으로 처리 중 비활성화.
 */
export default function ConfirmButton({
  action,
  confirmMessage,
  className,
  children,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy || isPending) return;
    if (!confirm(confirmMessage)) return;
    setBusy(true);
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        const msg = e instanceof Error ? e.message : '처리에 실패했어요.';
        alert(msg);
      } finally {
        setBusy(false);
      }
    });
  }

  const disabled = busy || isPending;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`${className ?? ''} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {disabled ? '처리 중…' : children}
    </button>
  );
}