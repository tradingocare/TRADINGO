'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { TradingoLogo } from '@/components/shared/tradingo-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (_data: ForgotForm) => {
    setServerError(null);
    try {
      // TODO: Send reset link
      setSent(true);
    } catch (err: any) {
      setServerError(err.message || 'Something went wrong');
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center space-y-4 text-center">
            <Link href="/">
              <TradingoLogo height={36} showText />
            </Link>
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-12 w-12 text-accent-500" />
              <CardTitle>Check your email</CardTitle>
              <CardDescription>
                We&apos;ve sent a password reset link to your email address. Please check your inbox.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
              &larr; Back to sign in
            </Link>
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
            <CardTitle>Forgot password?</CardTitle>
            <CardDescription>No worries, we&apos;ll send you reset instructions</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-10" {...register('email')} />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary dark:text-dark-text-secondary">
            <Link href="/login" className="inline-flex items-center gap-1 font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
