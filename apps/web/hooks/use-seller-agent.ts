import { useQuery } from '@tanstack/react-query';
import {
  getDashboardCopilot, getProductAdvisor, getSalesAdvisor,
  getAdvertisingAdvisor, getTrustAdvisor, getGrowthPlanner,
  getAgentNotifications, getAllInsights,
} from '@/lib/api/seller-agent';

export const SELLER_AGENT_QUERY_KEY = 'seller-agent';

export const useDashboardCopilot = () =>
  useQuery({
    queryKey: [SELLER_AGENT_QUERY_KEY, 'dashboard-copilot'],
    queryFn: getDashboardCopilot,
    staleTime: 60_000,
    retry: 1,
  });

export const useProductAdvisor = () =>
  useQuery({
    queryKey: [SELLER_AGENT_QUERY_KEY, 'product-advisor'],
    queryFn: getProductAdvisor,
    staleTime: 60_000,
    retry: 1,
  });

export const useSalesAdvisor = () =>
  useQuery({
    queryKey: [SELLER_AGENT_QUERY_KEY, 'sales-advisor'],
    queryFn: getSalesAdvisor,
    staleTime: 60_000,
    retry: 1,
  });

export const useAdvertisingAdvisor = () =>
  useQuery({
    queryKey: [SELLER_AGENT_QUERY_KEY, 'advertising-advisor'],
    queryFn: getAdvertisingAdvisor,
    staleTime: 60_000,
    retry: 1,
  });

export const useTrustAdvisor = () =>
  useQuery({
    queryKey: [SELLER_AGENT_QUERY_KEY, 'trust-advisor'],
    queryFn: getTrustAdvisor,
    staleTime: 60_000,
    retry: 1,
  });

export const useGrowthPlanner = () =>
  useQuery({
    queryKey: [SELLER_AGENT_QUERY_KEY, 'growth-planner'],
    queryFn: getGrowthPlanner,
    staleTime: 60_000,
    retry: 1,
  });

export const useAgentNotifications = () =>
  useQuery({
    queryKey: [SELLER_AGENT_QUERY_KEY, 'notifications'],
    queryFn: getAgentNotifications,
    staleTime: 60_000,
    retry: 1,
  });

export const useSellerAgentInsights = () =>
  useQuery({
    queryKey: [SELLER_AGENT_QUERY_KEY, 'insights'],
    queryFn: getAllInsights,
    staleTime: 60_000,
    retry: 1,
  });
