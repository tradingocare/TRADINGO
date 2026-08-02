'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useRegisterProfessional } from '@/hooks/use-tradeserv';
import { type RegistrationData, EMPTY_REGISTRATION, DRAFT_KEY, VERIFICATION_KEY, STEPS } from '../types';
import { validateStep, type StepErrors } from '../validation';
import { generateSlug, generateCategorySlug } from './use-slug';

export function useWizardState() {
  const { toast } = useToast();
  const router = useRouter();
  const registerMutation = useRegisterProfessional();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<RegistrationData>(EMPTY_REGISTRATION);
  const [errors, setErrors] = useState<StepErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as RegistrationData;
        setData(parsed);
        setLastSaved('Draft restored');
      }
    } catch {
      /* ignore corrupted storage */
    }
  }, []);

  const updateField = useCallback(<K extends keyof RegistrationData>(field: K, value: RegistrationData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const saveToLocalStorage = useCallback((currentData: RegistrationData) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(currentData));
      const now = new Date();
      setLastSaved(`Saved ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      setIsDirty(false);
    } catch {
      toast({ title: 'Auto-save failed', description: 'Could not save draft to local storage', variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    if (!isDirty) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveToLocalStorage(data), 30000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [data, isDirty, saveToLocalStorage]);

  const saveDraft = useCallback(() => {
    saveToLocalStorage(data);
    toast({ title: 'Draft saved', description: 'You can resume later from this browser.' });
  }, [data, saveToLocalStorage, toast]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= STEPS.length) {
      setCurrentStep(step);
      setErrors({});
    }
  }, []);

  const goNext = useCallback(() => {
    const errs = validateStep(currentStep, data);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast({ title: 'Please fix errors', description: `${Object.keys(errs).length} field(s) need attention`, variant: 'destructive' });
      return;
    }
    saveToLocalStorage(data);
    if (currentStep < STEPS.length) setCurrentStep((s) => s + 1);
  }, [currentStep, data, saveToLocalStorage, toast]);

  const goBack = useCallback(() => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const submit = useCallback(async () => {
    const allErrors: StepErrors = {};
    for (let s = 1; s <= STEPS.length; s++) {
      Object.assign(allErrors, validateStep(s, data));
    }
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      toast({ title: 'Validation failed', description: `${Object.keys(allErrors).length} field(s) need attention`, variant: 'destructive' });
      return;
    }

    try {
      const professionalType = data.plan === 'company' ? 'FIRM' : 'INDIVIDUAL_CONSULTANT';
      const location = [data.city, data.state].filter(Boolean).join(', ');

      const payload = {
        fullName: data.fullName,
        professionalTitle: data.professionalTitle,
        professionalType,
        companyName: data.fullName,
        mobile: data.phone || undefined,
        email: data.email || undefined,
        experience: data.yearsOfExperience || undefined,
        location: location || undefined,
      };

      const result = await registerMutation.mutateAsync(payload);

      const slug = result?.slug || generateSlug(data.fullName);
      const categorySlug = generateCategorySlug(data.category);

      const verificationData = {
        slug,
        categorySlug,
        status: data.identityDocName || data.qualificationDocNames.length > 0 ? 'documents_submitted' as const : 'pending' as const,
        submittedAt: new Date().toISOString(),
        estimatedReviewDays: 5,
      };
      try {
        localStorage.setItem(VERIFICATION_KEY, JSON.stringify(verificationData));
      } catch { /* storage unavailable */ }

      saveToLocalStorage(data);
      router.push('/tradeserv/register/success');
    } catch (err: any) {
      const message = err?.response?.data?.message
        ? (Array.isArray(err.response.data.message) ? err.response.data.message[0] : err.response.data.message)
        : err?.message || 'Something went wrong. Please try again.';
      toast({ title: 'Registration failed', description: message, variant: 'destructive' });
    }
  }, [data, saveToLocalStorage, router, toast, registerMutation]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(VERIFICATION_KEY);
    setData(EMPTY_REGISTRATION);
    setCurrentStep(1);
    setErrors({});
    setLastSaved(null);
    setIsDirty(false);
    toast({ title: 'Draft cleared', description: 'All saved data has been removed.' });
  }, [toast]);

  return {
    currentStep,
    data,
    errors,
    isDirty,
    lastSaved,
    isSubmitting: registerMutation.isPending,
    updateField,
    goToStep,
    goNext,
    goBack,
    saveDraft,
    submit,
    clearDraft,
    setData,
  };
}
