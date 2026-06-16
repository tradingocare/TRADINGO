'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Loader2, Lock, CheckCircle } from 'lucide-react';
import { TradingoLogo } from '@/components/shared/tradingo-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PasswordStrength } from '@/components/ui/password-strength';

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const password = watch('password');

  const onSubmit = async (_data: ResetForm) => {
    setServerError(null);
    try {
      // TODO: Reset password via token
      setDone(true);
    } catch (err: any) {
      setServerError(err.message || 'Something went wrong');
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center space-y-4 text-center">
            <Link href="/">
              <TradingoLogo height={36} showText />
            </Link>
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-12 w-12 text-accent-500" />
              <CardTitle>Password reset</CardTitle>
              <CardDescription>Your password has been successfully reset.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button className="w-full" size="lg">
                Sign in with new password
              </Button>
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
            <CardTitle>Reset password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
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
              <label htmlFor="password" className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  className="pl-10"
                  {...register('password')}
                />
              </div>
              <PasswordStrength password={password || ''} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat new password"
                  className="pl-10"
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset password'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary dark:text-dark-text-secondary">
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
              &larr; Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
