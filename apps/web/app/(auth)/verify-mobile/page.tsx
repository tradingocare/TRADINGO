'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, Smartphone } from 'lucide-react';
import { TradingoLogo } from '@/components/shared/tradingo-logo';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { OtpInput } from '@/components/ui/otp-input';

const MASKED_PHONE = '+1 (***) ***-1234';

export default function VerifyMobilePage() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(30);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = useCallback(async () => {
    setError(null);
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete verification code');
      return;
    }
    setLoading(true);
    try {
      // TODO: Verify mobile OTP
      setVerified(true);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }, [otp]);

  const handleResend = useCallback(async () => {
    setResendCooldown(30);
    // TODO: Resend OTP
  }, []);

  if (verified) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center space-y-4 text-center">
            <Link href="/">
              <TradingoLogo height={36} showText />
            </Link>
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-12 w-12 text-accent-500" />
              <CardTitle>Mobile verified</CardTitle>
              <CardDescription>Your mobile number has been successfully verified.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <Button className="w-full" size="lg" onClick={() => router.push('/dashboard')}>
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center space-y-4 text-center">
          <Link href="/">
            <TradingoLogo height={36} showText />
          </Link>
          <div>
            <CardTitle>Verify your mobile</CardTitle>
            <CardDescription>
              We&apos;ve sent a 6-digit code to{' '}
              <span className="font-medium text-text-primary dark:text-dark-text-primary">{MASKED_PHONE}</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 rounded-lg bg-surface-secondary px-4 py-3 text-sm text-text-secondary dark:bg-dark-surface-secondary dark:text-dark-text-secondary">
            <Smartphone className="h-4 w-4" />
            {MASKED_PHONE}
          </div>

          {error && (
            <div className="w-full rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <OtpInput length={6} value={otp} onChange={setOtp} disabled={loading} />

          <Button
            className="w-full"
            size="lg"
            onClick={handleVerify}
            disabled={loading || otp.join('').length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify mobile'
            )}
          </Button>

          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
            Didn&apos;t receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="font-medium text-primary-600 hover:text-primary-700 disabled:text-text-tertiary dark:text-primary-400 dark:disabled:text-dark-text-tertiary"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
