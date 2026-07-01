import api from './client'

export interface Plan {
  id: string
  planId: string
  name: string
  description: string | null
  pricePlanA: number
  pricePlanB: number
  pricePlanC: number
  duration: number
  features: string[]
  sortOrder: number
  isActive: boolean
  visibility: string
  isFree: boolean
  badgeText: string | null
  countryPricing: any
  upgradeRules: any
  downgradeRules: any
  gracePeriodDays: number
  renewalRules: any
  trialPeriodDays: number
  launchOfferEndsAt: string | null
  scheduledVisibility: string | null
  autoPublishAt: string | null
  autoHideAt: string | null
  metadata: any
  planFeatures: PlanFeature[]
  planAddons: PlanAddon[]
}

export interface PlanFeature {
  id: string
  planId: string
  category: string | null
  feature: string
  included: boolean
  value: string | null
  sortOrder: number
}

export interface PlanAddon {
  id: string
  planId: string
  name: string
  description: string | null
  price: number
  duration: number
  isActive: boolean
  sortOrder: number
}

export interface AuditLog {
  id: string
  planId: string
  action: string
  field: string | null
  oldValue: string | null
  newValue: string | null
  changedBy: string | null
  metadata: any
  createdAt: string
}

// Public endpoints
export const getLaunchPlans = () =>
  api.get('/membership/plans/launch').then(r => {
    const d = r.data?.data || r.data || r
    return Array.isArray(d) ? d as Plan[] : []
  })

export const getPlans = () =>
  api.get('/membership/plans').then(r => {
    const d = r.data?.data || r.data || r
    return Array.isArray(d) ? d as Plan[] : []
  })

export const getPlanBySlug = (slug: string) =>
  api.get(`/membership/plans/${slug}`).then(r => {
    const d = r.data?.data || r.data || r
    return d as Plan
  })

// Admin endpoints
export const adminGetAllPlans = () =>
  api.get('/admin/plans').then(r => {
    const d = r.data?.data || r.data || r
    return Array.isArray(d) ? d as Plan[] : []
  })

export const adminCreatePlan = (data: any) =>
  api.post('/admin/plans', data).then(r => r.data?.data || r.data || r)

export const adminUpdatePlan = (planId: string, data: any) =>
  api.patch(`/admin/plans/${planId}`, data).then(r => r.data?.data || r.data || r)

export const adminDeletePlan = (planId: string) =>
  api.delete(`/admin/plans/${planId}`).then(r => r.data?.data || r.data || r)

export const adminUpdatePlanVisibility = (planId: string, visibility: string) =>
  api.patch(`/admin/plans/${planId}/visibility`, { visibility }).then(r => r.data?.data || r.data || r)

// Feature Matrix Builder
export const adminBatchUpdateFeatures = (planId: string, features: any[]) =>
  api.post(`/admin/plans/${planId}/features/batch`, { features }).then(r => r.data?.data || r.data || r)

export const adminUpsertPlanFeature = (planId: string, data: any) =>
  api.post(`/admin/plans/${planId}/features`, data).then(r => r.data?.data || r.data || r)

export const adminDeletePlanFeature = (featureId: string) =>
  api.delete(`/admin/plans/features/${featureId}`).then(r => r.data?.data || r.data || r)

// Clone Plan
export const adminClonePlan = (planId: string, newPlanId: string, newName: string) =>
  api.post(`/admin/plans/${planId}/clone`, { newPlanId, newName }).then(r => r.data?.data || r.data || r)

// Schedule Plan
export const adminSchedulePlan = (planId: string, data: { scheduledVisibility?: string; autoPublishAt?: string; autoHideAt?: string }) =>
  api.post(`/admin/plans/${planId}/schedule`, data).then(r => r.data?.data || r.data || r)

export const adminProcessScheduled = () =>
  api.post('/admin/plans/process-scheduled').then(r => r.data?.data || r.data || r)

// Add-ons
export const adminCreatePlanAddon = (planId: string, data: any) =>
  api.post(`/admin/plans/${planId}/addons`, data).then(r => r.data?.data || r.data || r)

export const adminDeletePlanAddon = (addonId: string) =>
  api.delete(`/admin/plans/addons/${addonId}`).then(r => r.data?.data || r.data || r)

// Launch Mode
export const adminGetLaunchMode = () =>
  api.get('/admin/plans/launch-mode').then(r => (r.data?.data || r.data || r) as { enabled: boolean; visiblePlans: string[] })

export const adminSetLaunchMode = (enabled: boolean) =>
  api.post('/admin/plans/launch-mode', { enabled }).then(r => r.data?.data || r.data || r)

// Seed
export const adminSeedLaunchPlans = () =>
  api.post('/admin/plans/seed-launch').then(r => r.data?.data || r.data || r)

// Comparison Builder
export const adminComparePlans = (planIds: string[]) =>
  api.post('/admin/plans/compare', { planIds }).then(r => (r.data?.data || r.data || r) as {
    plans: any[]; featureMatrix: { key: string; category: string; label: string; values: { included: boolean; value: string }[] }[]
  })

// Upgrade Simulator
export const adminSimulateUpgrade = (from: string, to: string) =>
  api.get(`/admin/plans/simulate-upgrade?from=${from}&to=${to}`).then(r => (r.data?.data || r.data || r) as {
    fromPlan: any; toPlan: any; unlocked: any[]; upgraded: any[]; same: string[]
  })

// Feature Preview
export const adminGetFeaturePreview = (planId: string) =>
  api.get(`/admin/plans/${planId}/features-preview`).then(r => (r.data?.data || r.data || r) as {
    planId: string; name: string; totalFeatures: number; included: any[]; locked: any[]; limits: any[]
  })

// Audit Logs
export const adminGetPlanAuditLogs = (planId: string, page?: number, limit?: number) =>
  api.get(`/admin/plans/${planId}/audit-logs?page=${page || 1}&limit=${limit || 50}`).then(r => (r.data?.data || r.data || r) as {
    items: AuditLog[]; total: number; page: number; limit: number; totalPages: number
  })

export const adminGetAllAuditLogs = (page?: number, limit?: number) =>
  api.get(`/admin/plans/audit-logs?page=${page || 1}&limit=${limit || 50}`).then(r => (r.data?.data || r.data || r) as {
    items: AuditLog[]; total: number; page: number; limit: number; totalPages: number
  })
