import { apiClient } from './client';

export type RegistrationFormStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface RegistrationForm {
  formId: string;
  status: RegistrationFormStatus;
  currentStep: number;
  completionPct: number;
  selectedPlanId: string | null;
  selectedPlanVersionId: string | null;
  companyId: string | null;
  submittedAt: string | null;
  draftPayload: Record<string, unknown>;
  updatedAt: string;
}

export interface OpenRegistrationFormResult {
  created: boolean;
  form: RegistrationForm;
}

export function openRegistrationForm(selectedPlanId?: string): Promise<OpenRegistrationFormResult> {
  return apiClient
    .post<OpenRegistrationFormResult>('/registration/forms', selectedPlanId ? { selectedPlanId } : {})
    .then((r) => r.data);
}

export function getRegistrationForm(formId: string): Promise<{ form: RegistrationForm }> {
  return apiClient
    .get<{ form: RegistrationForm }>(`/registration/forms/${encodeURIComponent(formId)}`)
    .then((r) => r.data);
}

export interface SaveRegistrationDraftInput {
  currentStep?: number;
  selectedPlanId?: string;
  fields?: Record<string, unknown>;
  clientUpdatedAt: string;
}

export function saveRegistrationDraft(
  formId: string,
  input: SaveRegistrationDraftInput,
): Promise<{ form: RegistrationForm }> {
  return apiClient
    .patch<{ form: RegistrationForm }>(`/registration/forms/${encodeURIComponent(formId)}/draft`, input)
    .then((r) => r.data);
}

export interface SubmitRegistrationFormResult {
  form: RegistrationForm;
  companyId: string;
}

export function submitRegistrationForm(
  formId: string,
  body: Record<string, unknown>,
): Promise<SubmitRegistrationFormResult> {
  return apiClient
    .post<SubmitRegistrationFormResult>(`/registration/forms/${encodeURIComponent(formId)}/submit`, body)
    .then((r) => r.data);
}
