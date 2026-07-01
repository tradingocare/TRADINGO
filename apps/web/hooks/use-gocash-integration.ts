import { useQuery, useMutation } from '@tanstack/react-query';
import * as gocashIntegrationApi from '@/lib/api/gocash-integration';

export function useIntegrationSummary(userId?: string) {
  return useQuery({
    queryKey: ['gocash-integration', 'summary', userId],
    queryFn: () => gocashIntegrationApi.getIntegrationSummary(userId!),
    enabled: !!userId,
  });
}

export function useAwardSignupBonus() {
  return useMutation({ mutationFn: ({ userId, companyId }: { userId: string; companyId: string }) => gocashIntegrationApi.awardSignupBonus(userId, companyId) });
}

export function useAwardPlanUpgrade() {
  return useMutation({ mutationFn: ({ userId, companyId, planId }: { userId: string; companyId: string; planId?: string }) => gocashIntegrationApi.awardPlanUpgrade(userId, companyId, planId) });
}

export function useAwardOrderCompleted() {
  return useMutation({ mutationFn: (params: { orderId: string; userId: string; companyId: string; orderNumber?: string }) => gocashIntegrationApi.awardOrderCompleted(params.orderId, params.userId, params.companyId, params.orderNumber) });
}

export function useAwardRfqCreated() {
  return useMutation({ mutationFn: (params: { rfqId: string; userId: string; companyId: string }) => gocashIntegrationApi.awardRfqCreated(params.rfqId, params.userId, params.companyId) });
}

export function useAwardQuoteAccepted() {
  return useMutation({ mutationFn: (params: { quoteId: string; buyerId: string; sellerId: string; companyId: string }) => gocashIntegrationApi.awardQuoteAccepted(params.quoteId, params.buyerId, params.sellerId, params.companyId) });
}

export function useAwardNegotiationCompleted() {
  return useMutation({ mutationFn: (params: { negotiationId: string; userId: string; companyId: string }) => gocashIntegrationApi.awardNegotiationCompleted(params.negotiationId, params.userId, params.companyId) });
}

export function useAwardPoConfirmed() {
  return useMutation({ mutationFn: (params: { poId: string; userId: string; companyId: string }) => gocashIntegrationApi.awardPoConfirmed(params.poId, params.userId, params.companyId) });
}

export function useAwardShipmentConfirmed() {
  return useMutation({ mutationFn: (params: { shipmentId: string; userId: string; companyId: string }) => gocashIntegrationApi.awardShipmentConfirmed(params.shipmentId, params.userId, params.companyId) });
}

export function useAwardDeliveryConfirmed() {
  return useMutation({ mutationFn: (params: { deliveryId: string; userId: string; companyId: string }) => gocashIntegrationApi.awardDeliveryConfirmed(params.deliveryId, params.userId, params.companyId) });
}
