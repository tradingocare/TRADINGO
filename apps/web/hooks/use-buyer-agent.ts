import { useQuery } from '@tanstack/react-query';
import {
  getBuyerDashboardCopilot, getSmartProcurement, getBuyerRfqAssistant,
  getSupplierIntelligence, getBuyerNegotiationAdvisor, getCostOptimization,
  getBuyerAgentNotifications, getBuyerAllInsights,
} from '@/lib/api/buyer-agent';

export const BUYER_AGENT_QUERY_KEY = 'buyer-agent';

export const useBuyerDashboardCopilot = () =>
  useQuery({
    queryKey: [BUYER_AGENT_QUERY_KEY, 'dashboard-copilot'],
    queryFn: getBuyerDashboardCopilot,
    staleTime: 60_000,
    retry: 1,
  });

export const useSmartProcurement = () =>
  useQuery({
    queryKey: [BUYER_AGENT_QUERY_KEY, 'smart-procurement'],
    queryFn: getSmartProcurement,
    staleTime: 60_000,
    retry: 1,
  });

export const useBuyerRfqAssistant = () =>
  useQuery({
    queryKey: [BUYER_AGENT_QUERY_KEY, 'rfq-assistant'],
    queryFn: getBuyerRfqAssistant,
    staleTime: 60_000,
    retry: 1,
  });

export const useSupplierIntelligence = () =>
  useQuery({
    queryKey: [BUYER_AGENT_QUERY_KEY, 'supplier-intelligence'],
    queryFn: getSupplierIntelligence,
    staleTime: 60_000,
    retry: 1,
  });

export const useBuyerNegotiationAdvisor = () =>
  useQuery({
    queryKey: [BUYER_AGENT_QUERY_KEY, 'negotiation-advisor'],
    queryFn: getBuyerNegotiationAdvisor,
    staleTime: 60_000,
    retry: 1,
  });

export const useCostOptimization = () =>
  useQuery({
    queryKey: [BUYER_AGENT_QUERY_KEY, 'cost-optimization'],
    queryFn: getCostOptimization,
    staleTime: 60_000,
    retry: 1,
  });

export const useBuyerAgentNotifications = () =>
  useQuery({
    queryKey: [BUYER_AGENT_QUERY_KEY, 'notifications'],
    queryFn: getBuyerAgentNotifications,
    staleTime: 60_000,
    retry: 1,
  });

export const useBuyerAllInsights = () =>
  useQuery({
    queryKey: [BUYER_AGENT_QUERY_KEY, 'insights'],
    queryFn: getBuyerAllInsights,
    staleTime: 60_000,
    retry: 1,
  });
