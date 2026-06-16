'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, User, Lock } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { setAccessToken } from '@/lib/auth';
import { useAuthStore } from '@/store/auth-store';
import { TradingoLogo } from '@/components/shared/tradingo-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PasswordStrength } from '@/components/ui/password-strength';

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string(),
    role: z.enum(['seller', 'buyer'], { required_error: 'Please select a role' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'buyer' },
  });

  const password = watch('password');
  const role = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    try {
      const res = await apiClient.post<{
        user: { id: string; email: string; name: string; role: 'SELLER' | 'BUYER' | 'ADMIN' | 'SUPER_ADMIN'; isVerified: boolean; createdAt: string };
        accessToken: string;
        refreshToken: string;
      }>('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      setAccessToken(res.accessToken);

      await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: res.refreshToken }),
      });

      setAuth(res.user, res.accessToken);
      router.push(data.role === 'seller' ? '/register/seller' : '/register/buyer');
    } catch (err: any) {
      setServerError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center space-y-4 text-center">
          <Link href="/">
            <TradingoLogo height={36} showText />
          </Link>
          <div>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Join Tradingo today</CardDescription>
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
              <label htmlFor="name" className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <Input id="name" type="text" placeholder="John Doe" className="pl-10" {...register('name')} />
              </div>
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

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

            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  className="pl-10"
                  {...register('password')}
                />
              </div>
              <PasswordStrength password={password || ''} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  className="pl-10"
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                I want to
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setValue('role', 'seller')}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                    role === 'seller'
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/20 dark:text-primary-300'
                      : 'border-border bg-surface text-text-secondary hover:border-border dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-secondary'
                  }`}
                >
                  <span className="block text-base">🏪</span>
                  Seller
                </button>
                <button
                  type="button"
                  onClick={() => setValue('role', 'buyer')}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                    role === 'buyer'
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/20 dark:text-primary-300'
                      : 'border-border bg-surface text-text-secondary hover:border-border dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-secondary'
                  }`}
                >
                  <span className="block text-base">🛒</span>
                  Buyer
                </button>
              </div>
              {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border dark:border-dark-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-text-tertiary dark:bg-dark-surface dark:text-dark-text-tertiary">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full" type="button">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
            <Button variant="outline" className="w-full" type="button">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"/>
              </svg>
              LinkedIn
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-text-secondary dark:text-dark-text-secondary">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
