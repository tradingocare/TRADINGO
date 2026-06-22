'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Building2, Phone, Grid3X3 } from 'lucide-react';
import { TradingoLogo } from '@/components/shared/tradingo-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const buyerSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  industry: z.string().min(1, 'Industry is required'),
});

type BuyerForm = z.infer<typeof buyerSchema>;

export default function BuyerRegistrationPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BuyerForm>({
    resolver: zodResolver(buyerSchema),
  });

  const onSubmit = async (_data: BuyerForm) => {
    setServerError(null);
    try {
      // TODO: Submit buyer details
      router.push('/dashboard');
    } catch (err: any) {
      setServerError(err.message || 'Submission failed');
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
            <CardTitle>Buyer details</CardTitle>
            <CardDescription>Tell us about your company</CardDescription>
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
              <label htmlFor="companyName" className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Company name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <Input id="companyName" type="text" placeholder="Your company" className="pl-10" {...register('companyName')} />
              </div>
              {errors.companyName && <p className="text-xs text-red-500">{errors.companyName.message}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="phone" className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Phone number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" className="pl-10" {...register('phone')} />
              </div>
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="industry" className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Industry
              </label>
              <div className="relative">
                <Grid3X3 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <Input id="industry" type="text" placeholder="Technology, Healthcare, etc." className="pl-10" {...register('industry')} />
              </div>
              {errors.industry && <p className="text-xs text-red-500">{errors.industry.message}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue to dashboard'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary dark:text-dark-text-secondary">
            <Link href="/register" className="font-medium text-accent-500 hover:text-accent-600 dark:text-accent-400">
              &larr; Back to registration
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
