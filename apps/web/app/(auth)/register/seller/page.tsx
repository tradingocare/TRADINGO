'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Building2, Phone, Hash, Briefcase } from 'lucide-react';
import { TradingoLogo } from '@/components/shared/tradingo-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const sellerSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  gst: z.string().min(15, 'Valid GST number is required').max(15),
  businessType: z.string().min(1, 'Business type is required'),
});

type SellerForm = z.infer<typeof sellerSchema>;

export default function SellerRegistrationPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SellerForm>({
    resolver: zodResolver(sellerSchema),
  });

  const onSubmit = async (_data: SellerForm) => {
    setServerError(null);
    try {
      // TODO: Submit seller details
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
            <CardTitle>Seller details</CardTitle>
            <CardDescription>Tell us about your business</CardDescription>
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
              <label htmlFor="gst" className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                GST number
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <Input id="gst" type="text" placeholder="22AAAAA0000A1Z5" className="pl-10" {...register('gst')} />
              </div>
              {errors.gst && <p className="text-xs text-red-500">{errors.gst.message}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="businessType" className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                Business type
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <Input id="businessType" type="text" placeholder="Manufacturer, Distributor, etc." className="pl-10" {...register('businessType')} />
              </div>
              {errors.businessType && <p className="text-xs text-red-500">{errors.businessType.message}</p>}
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
