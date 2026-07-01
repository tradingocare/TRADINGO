'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Building2, Globe, Users, Briefcase, ListTree, FileText, Bell, Languages, DollarSign, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SELLER_ONBOARDING_STEPS } from '@/data/master-data';
import { TradingoLogo } from '@/components/shared/tradingo-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const step1Schema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  companySize: z.string().min(1, 'Company size is required'),
});

const step2Schema = z.object({
  businessType: z.string().min(1, 'Business type is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Please provide at least 10 characters'),
});

const step3Schema = z.object({
  notifications: z.boolean(),
  language: z.string().min(1, 'Language is required'),
  currency: z.string().min(1, 'Currency is required'),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;

const STEP_ICONS: Record<number, React.ComponentType<{ className?: string }>> = {
  1: Building2,
  2: Globe,
  3: FileText,
  4: Check,
};

const steps = SELLER_ONBOARDING_STEPS;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);

  const step1 = useForm<Step1>({ resolver: zodResolver(step1Schema) });
  const step2 = useForm<Step2>({ resolver: zodResolver(step2Schema) });
  const step3 = useForm<Step3>({ resolver: zodResolver(step3Schema) });

  const forms = [step1, step2, step3];
  const currentForm = forms[step - 1];

  const handleNext = async () => {
    const isValid = await currentForm.trigger();
    if (!isValid) return;
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleComplete = async () => {
    const isValid = await step3.trigger();
    if (!isValid) return;
    setServerError(null);
    try {
      const apiClient = (await import('@/lib/api/client')).default;
      const data = {
        ...step1.getValues(),
        ...step2.getValues(),
        ...step3.getValues(),
      };
      // Use the onboarding controller to advance
      const companyId = localStorage.getItem('currentCompanyId');
      if (companyId) {
        await apiClient.post(`/onboarding/${companyId}/advance`, { onboardingStatus: 'BUSINESS_ADDED', data });
      }
      router.push('/dashboard');
    } catch (err: any) {
      setServerError(err?.response?.data?.message || err.message || 'Submission failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="items-center space-y-4 text-center">
          <Link href="/">
            <TradingoLogo height={36} showText />
          </Link>
          <div>
            <CardTitle>Complete your profile</CardTitle>
            <CardDescription>Set up your account in a few steps</CardDescription>
          </div>

          <div className="flex w-full items-center justify-center gap-0">
            {steps.map((s, i) => {
              const Icon = STEP_ICONS[s.step];
              const isActive = step === s.step;
              const isCompleted = step > s.step;
              return (
                <div key={s.step} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all',
                        isCompleted &&
                          'border-accent-500 bg-accent-500 text-white',
                        isActive &&
                          'border-accent-500 bg-accent-500 text-white',
                        !isActive &&
                          !isCompleted &&
                          'border-border bg-surface text-text-tertiary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-tertiary',
                      )}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span
                      className={cn(
                        'text-xs',
                        isActive && 'font-medium text-accent-500 dark:text-accent-400',
                        isCompleted && 'text-accent-600 dark:text-accent-400',
                        !isActive && !isCompleted && 'text-text-tertiary dark:text-dark-text-tertiary',
                      )}
                    >
                      {s.title}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        'mx-2 h-0.5 w-12 sm:w-20',
                        step > s.step ? 'bg-accent-500' : 'bg-border dark:bg-dark-border',
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {serverError}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                  Company name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    type="text"
                    placeholder="Your company"
                    className="pl-10"
                    {...step1.register('companyName')}
                  />
                </div>
                {step1.formState.errors.companyName && (
                  <p className="text-xs text-red-500">{step1.formState.errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    className="pl-10"
                    {...step1.register('website')}
                  />
                </div>
                {step1.formState.errors.website && (
                  <p className="text-xs text-red-500">{step1.formState.errors.website.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                  Company size
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-surface px-10 py-2 text-sm text-text-primary ring-offset-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary"
                    {...step1.register('companySize')}
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501+">501+ employees</option>
                  </select>
                </div>
                {step1.formState.errors.companySize && (
                  <p className="text-xs text-red-500">{step1.formState.errors.companySize.message}</p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                  Business type
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    type="text"
                    placeholder="Manufacturer, Distributor, etc."
                    className="pl-10"
                    {...step2.register('businessType')}
                  />
                </div>
                {step2.formState.errors.businessType && (
                  <p className="text-xs text-red-500">{step2.formState.errors.businessType.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                  Category
                </label>
                <div className="relative">
                  <ListTree className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    type="text"
                    placeholder="Electronics, Textiles, etc."
                    className="pl-10"
                    {...step2.register('category')}
                  />
                </div>
                {step2.formState.errors.category && (
                  <p className="text-xs text-red-500">{step2.formState.errors.category.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-text-tertiary" />
                  <textarea
                    rows={4}
                    placeholder="Tell us about your business..."
                    className="w-full rounded-lg border border-border bg-surface px-10 py-2 text-sm text-text-primary ring-offset-surface placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary"
                    {...step2.register('description')}
                  />
                </div>
                {step2.formState.errors.description && (
                  <p className="text-xs text-red-500">{step2.formState.errors.description.message}</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4 dark:border-dark-border">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-text-secondary dark:text-dark-text-secondary" />
                  <div>
                    <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                      Email notifications
                    </p>
                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                      Receive updates about your activity
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    {...step3.register('notifications')}
                  />
                  <div className="h-6 w-11 rounded-full border border-border bg-surface after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-surface after:transition-all peer-checked:bg-accent-500 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-dark-border dark:bg-dark-surface dark:after:border-dark-border dark:peer-checked:bg-accent-500" />
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                  Language
                </label>
                <div className="relative">
                  <Languages className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-surface px-10 py-2 text-sm text-text-primary ring-offset-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary"
                    {...step3.register('language')}
                  >
                    <option value="">Select language</option>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>
                {step3.formState.errors.language && (
                  <p className="text-xs text-red-500">{step3.formState.errors.language.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                  Currency
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-surface px-10 py-2 text-sm text-text-primary ring-offset-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary"
                    {...step3.register('currency')}
                  >
                    <option value="">Select currency</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="INR">INR - Indian Rupee</option>
                  </select>
                </div>
                {step3.formState.errors.currency && (
                  <p className="text-xs text-red-500">{step3.formState.errors.currency.message}</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
            >
              Back
            </Button>

            {step < 3 ? (
              <Button type="button" onClick={handleNext} size="lg">
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                size="lg"
                disabled={step3.formState.isSubmitting}
              >
                {step3.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
