import { apiClient } from './client';

export interface IntegrationSummary {
  totalRewards: number;
  totalTransactions: number;
  breakdown: Record<string, { count: number; total: number }>;
  recent: Array<{
    id: string;
    amount: number;
    type: string;
    reason: string;
    referenceType: string;
    createdAt: string;
  }>;
}

export function awardSignupBonus(userId: string, companyId: string) {
  return apiClient.post('/gocash-integration/membership/signup', { userId, companyId }).then(r => r.data);
}

export function awardPlanUpgrade(userId: string, companyId: string, planId?: string) {
  return apiClient.post('/gocash-integration/membership/plan-upgrade', { userId, companyId, planId }).then(r => r.data);
}

export function awardOrderCompleted(orderId: string, userId: string, companyId: string, orderNumber?: string) {
  return apiClient.post('/gocash-integration/order/completed', { orderId, userId, companyId, orderNumber }).then(r => r.data);
}

export function awardRfqCreated(rfqId: string, userId: string, companyId: string) {
  return apiClient.post('/gocash-integration/rfq/created', { rfqId, userId, companyId }).then(r => r.data);
}

export function awardQuoteAccepted(quoteId: string, buyerId: string, sellerId: string, companyId: string) {
  return apiClient.post('/gocash-integration/quote/accepted', { quoteId, buyerId, sellerId, companyId }).then(r => r.data);
}

export function awardNegotiationCompleted(negotiationId: string, userId: string, companyId: string) {
  return apiClient.post('/gocash-integration/negotiation/completed', { negotiationId, userId, companyId }).then(r => r.data);
}

export function awardPoConfirmed(poId: string, userId: string, companyId: string) {
  return apiClient.post('/gocash-integration/po/confirmed', { poId, userId, companyId }).then(r => r.data);
}

export function awardShipmentConfirmed(shipmentId: string, userId: string, companyId: string) {
  return apiClient.post('/gocash-integration/shipment/confirmed', { shipmentId, userId, companyId }).then(r => r.data);
}

export function awardDeliveryConfirmed(deliveryId: string, userId: string, companyId: string) {
  return apiClient.post('/gocash-integration/delivery/confirmed', { deliveryId, userId, companyId }).then(r => r.data);
}

export function getIntegrationSummary(userId: string) {
  return apiClient.get<IntegrationSummary>(`/gocash-integration/summary/${userId}`).then(r => r.data);
}
