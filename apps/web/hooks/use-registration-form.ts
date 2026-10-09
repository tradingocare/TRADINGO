import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as registrationFormsApi from '@/lib/api/registration-forms';
import type { SaveRegistrationDraftInput } from '@/lib/api/registration-forms';

export function useOpenRegistrationForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (selectedPlanId?: string) => registrationFormsApi.openRegistrationForm(selectedPlanId),
    onSuccess: (result) => {
      qc.setQueryData(['registration-form', result.form.formId], { form: result.form });
    },
  });
}

export function useRegistrationForm(formId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['registration-form', formId],
    queryFn: () => registrationFormsApi.getRegistrationForm(formId as string),
    enabled: enabled && !!formId,
    staleTime: 30_000,
  });
}

export function useSaveRegistrationDraft(formId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveRegistrationDraftInput) =>
      registrationFormsApi.saveRegistrationDraft(formId as string, input),
    onSuccess: (result) => {
      if (formId) qc.setQueryData(['registration-form', formId], result);
    },
  });
}
