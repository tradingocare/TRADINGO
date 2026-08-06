import { useQuery } from '@tanstack/react-query';
import {
  getAdminDashboardCopilot, getAdminSystemHealth, getAdminUserActivity,
  getAdminFraudIntelligence, getAdminRevenueAnalytics, getAdminModerationQueue,
  getAdminPlatformGrowth, getAdminPerformanceMetrics, getAdminDailyBrief,
  getAdminAgentAllInsights,
} from '@/lib/api/admin-agent';

export const ADMIN_AGENT_QUERY_KEY = 'admin-agent';

export const useAdminDashboardCopilot = () =>
  useQuery({
    queryKey: [ADMIN_AGENT_QUERY_KEY, 'dashboard-copilot'],
    queryFn: getAdminDashboardCopilot,
    staleTime: 60_000,
    retry: 1,
  });

export const useAdminSystemHealth = () =>
  useQuery({
    queryKey: [ADMIN_AGENT_QUERY_KEY, 'system-health'],
    queryFn: getAdminSystemHealth,
    staleTime: 60_000,
    retry: 1,
  });

export const useAdminUserActivity = () =>
  useQuery({
    queryKey: [ADMIN_AGENT_QUERY_KEY, 'user-activity'],
    queryFn: getAdminUserActivity,
    staleTime: 60_000,
    retry: 1,
  });

export const useAdminFraudIntelligence = () =>
  useQuery({
    queryKey: [ADMIN_AGENT_QUERY_KEY, 'fraud-intelligence'],
    queryFn: getAdminFraudIntelligence,
    staleTime: 60_000,
    retry: 1,
  });

export const useAdminRevenueAnalytics = () =>
  useQuery({
    queryKey: [ADMIN_AGENT_QUERY_KEY, 'revenue-analytics'],
    queryFn: getAdminRevenueAnalytics,
    staleTime: 60_000,
    retry: 1,
  });

export const useAdminModerationQueue = () =>
  useQuery({
    queryKey: [ADMIN_AGENT_QUERY_KEY, 'moderation-queue'],
    queryFn: getAdminModerationQueue,
    staleTime: 60_000,
    retry: 1,
  });

export const useAdminPlatformGrowth = () =>
  useQuery({
    queryKey: [ADMIN_AGENT_QUERY_KEY, 'platform-growth'],
    queryFn: getAdminPlatformGrowth,
    staleTime: 60_000,
    retry: 1,
  });

export const useAdminPerformanceMetrics = () =>
  useQuery({
    queryKey: [ADMIN_AGENT_QUERY_KEY, 'performance-metrics'],
    queryFn: getAdminPerformanceMetrics,
    staleTime: 60_000,
    retry: 1,
  });

export const useAdminDailyBrief = () =>
  useQuery({
    queryKey: [ADMIN_AGENT_QUERY_KEY, 'daily-brief'],
    queryFn: getAdminDailyBrief,
    staleTime: 60_000,
    retry: 1,
  });

export const useAdminAgentAllInsights = () =>
  useQuery({
    queryKey: [ADMIN_AGENT_QUERY_KEY, 'insights'],
    queryFn: getAdminAgentAllInsights,
    staleTime: 60_000,
    retry: 1,
  });
