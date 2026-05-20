'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginShell() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black mb-2">교랑톡 관리자</h1>
          <p className="text-sm text-white/50">로딩 중...</p>
        </div>
      </div>
    </div>
  );
}

type Step = 'phone' | 'otp';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const errorParam = params.get('error');

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === 'not_admin' ? '관리자 권한이 없습니다' : null,
  );
  const [info, setInfo] = useState<string | null>(null);

  const supabase = createClient();

  // 한국 번호 정규화: "010-1234-5678" 또는 "01012345678" → "+821012345678"
  function normalizePhone(input: string): string {
    let p = input.replace(/[^0-9+]/g, '');
    if (p.startsWith('+')) return p;
    if (p.startsWith('010')) return '+82' + p.slice(1);
    if (p.startsWith('82')) return '+' + p;
    return '+82' + p;
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const normalized = normalizePhone(phone);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: normalized,
    });

    if (otpError) {
      setError(otpError.message);
      setLoading(false);
      return;
    }

    setInfo('인증번호를 발송했어요 (1~2분 소요될 수 있어요)');
    setStep('otp');
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalized = normalizePhone(phone);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: normalized,
      token: otp.trim(),
      type: 'sms',
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    router.refresh();
    router.push('/reports');
  }

  function handleBackToPhone() {
    setStep('phone');
    setOtp('');
    setError(null);
    setInfo(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black mb-2">교랑톡 관리자</h1>
          <p className="text-sm text-white/50">
            {step === 'phone'
              ? '관리자 계정의 핸드폰 번호로 로그인'
              : '문자로 받은 6자리 코드를 입력하세요'}
          </p>
        </div>

        {step === 'phone' ? (
          <form
            onSubmit={handleSendOtp}
            className="bg-bgCard border border-border rounded-2xl p-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-white/70 mb-2">
                핸드폰 번호
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                placeholder="010-1234-5678"
              />
              <p className="text-xs text-white/40 mt-2">
                교랑톡에 가입한 번호와 같아야 해요
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="w-full py-3 bg-primary hover:bg-primaryLight disabled:opacity-50 disabled:cursor-not-allowed text-bg font-bold rounded-lg transition-colors"
            >
              {loading ? '발송 중...' : '인증번호 받기'}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleVerifyOtp}
            className="bg-bgCard border border-border rounded-2xl p-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-white/70 mb-2">
                인증번호 (6자리)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/[^0-9]/g, ''))
                }
                required
                autoFocus
                className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-xl font-mono tracking-widest text-center focus:outline-none focus:border-primary"
                placeholder="000000"
              />
              <p className="text-xs text-white/40 mt-2">
                {normalizePhone(phone)} 로 발송됨
              </p>
            </div>

            {info && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-sm text-primary">
                {info}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-primary hover:bg-primaryLight disabled:opacity-50 disabled:cursor-not-allowed text-bg font-bold rounded-lg transition-colors"
            >
              {loading ? '확인 중...' : '로그인'}
            </button>

            <button
              type="button"
              onClick={handleBackToPhone}
              className="w-full py-2 text-sm text-white/50 hover:text-white transition-colors"
            >
              ← 번호 다시 입력
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-white/40">
          교랑톡 운영자 전용 페이지입니다
        </p>
      </div>
    </div>
  );
}