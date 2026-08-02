import api from './client';

export interface RevenueKpis {
  mrr: number;
  arr: number;
  mrrGrowth: number;
  churnRate: number;
  churnedLastMonth: number;
  activeSubscriptions: number;
  currentMonthTransactions: number;
  prevMonthTransactions: number;
  currency: string;
}

export interface SubscriptionMetrics {
  statusBreakdown: Record<string, number>;
  total: number;
  expiringSoon: number;
  recentActivations: number;
  recentChurns: number;
}

export interface RevenueOverview {
  totalRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  mrr: number;
  arr: number;
  totalTransactions: number;
  monthTransactions: number;
  activeSubscriptions: number;
  invoiceCount: number;
  totalInvoiced: number;
  totalTaxCollected: number;
  planBreakdown: Array<{ planName: string; revenue: number; count: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  currency: string;
}

export interface SubscriptionDetail {
  id: string;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  subscriptionActivatedAt: string | null;
  subscriptionExpiresAt: string | null;
  subscriptionGraceStart: string | null;
  currentPlanId: string | null;
  currentPlan: {
    planId: string; name: string; pricePlanA: number;
    pricePlanB: number; pricePlanC: number;
    duration: number; isFree: boolean; badgeText: string | null;
    features: any;
  } | null;
  daysLeft: number;
  recentEvents: any[];
}

export function getRevenueKpis() { return api.get<RevenueKpis>('/analytics/admin/revenue-kpis').then(r => r.data); }

export function getSubscriptionMetrics() { return api.get<SubscriptionMetrics>('/analytics/admin/subscription-metrics').then(r => r.data); }

export function getRevenueOverview() { return api.get<RevenueOverview>('/admin/billing/revenue-overview').then(r => r.data); }

export function getAllSubscriptions(params?: { page?: number; limit?: number; status?: string; search?: string }) { return api.get('/admin/plans/subscriptions', { params }).then(r => r.data); }

export function getSubscriptionSummary() { return api.get('/admin/plans/subscriptions/summary').then(r => r.data); }

export function calculateProration(companyId: string, newPlanPrice: number) { return api.get(`/admin/billing/prorate/${companyId}`, { params: { newPlanPrice } }).then(r => r.data); }

export function processExpiredSubscriptions() { return api.post('/admin/plans/process-expired').then(r => r.data); }

// Buyer/Seller endpoints
export function getCurrentSubscription() { return api.get('/membership/current').then(r => r.data); }

export function getSubscriptionDetail() { return api.get<SubscriptionDetail>('/membership/detail').then(r => r.data); }

export function enrollTrial(planId: string) { return api.post('/membership/trial', { planId }).then(r => r.data); }

export function upgradeSubscription(newPlanId: string, planTier: string, amount: number, paymentId: string) { return api.post('/membership/upgrade', { newPlanId, planTier, amount, paymentId }).then(r => r.data); }

export function downgradeSubscription(newPlanId: string, effectiveAt?: string) { return api.post('/membership/downgrade', { newPlanId, effectiveAt }).then(r => r.data); }

export function renewSubscription(amount: number, paymentId: string) { return api.post('/membership/renew', { amount, paymentId }).then(r => r.data); }

export function suspendSubscription(reason: string) { return api.post('/membership/suspend', { reason }).then(r => r.data); }

export function reactivateSubscription() { return api.post('/membership/reactivate').then(r => r.data); }
