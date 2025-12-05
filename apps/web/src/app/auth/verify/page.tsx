'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useI18n } from '@/lib/i18n';

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/verify-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      login(data.accessToken, data.refreshToken);
      router.push('/tickets');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResendDisabled(true);
    setCountdown(60);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/send-verification-code`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to resend code');
      }
    } catch (err: any) {
      setError(err.message);
      setResendDisabled(false);
      setCountdown(0);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t.auth.verifyEmail}</h1>
          <p className="mt-2 text-muted-foreground">
            {t.auth.enterCode}{' '}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-error/10 text-error text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="code" className="block text-sm font-medium mb-2">
              {t.auth.enterCode}
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={6}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-center text-2xl tracking-widest"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full py-3 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {isLoading ? t.common.loading : t.auth.verifyEmail}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={handleResend}
            disabled={resendDisabled}
            className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
          >
            {countdown > 0
              ? `${t.auth.resendCode} (${countdown}s)`
              : t.auth.resendCode}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
