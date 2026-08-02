import { useQuery } from '@tanstack/react-query';
import { enterpriseIntelligenceApi } from '@/lib/api/enterprise-intelligence';

export function useEnterpriseIntelligence() {
  return useQuery({
    queryKey: ['enterprise-intelligence', 'full'],
    queryFn: () => enterpriseIntelligenceApi.getFull(),
    refetchInterval: 300000,
  });
}

export function useDigitalTwin() {
  return useQuery({
    queryKey: ['enterprise-intelligence', 'digital-twin'],
    queryFn: () => enterpriseIntelligenceApi.getDigitalTwin(),
    refetchInterval: 300000,
  });
}

export function useHealthIndex() {
  return useQuery({
    queryKey: ['enterprise-intelligence', 'health-index'],
    queryFn: () => enterpriseIntelligenceApi.getHealthIndex(),
    refetchInterval: 300000,
  });
}

export function useBusinessConfidence() {
  return useQuery({
    queryKey: ['enterprise-intelligence', 'business-confidence'],
    queryFn: () => enterpriseIntelligenceApi.getBusinessConfidence(),
    refetchInterval: 300000,
  });
}

export function useSupplyDemand() {
  return useQuery({
    queryKey: ['enterprise-intelligence', 'supply-demand'],
    queryFn: () => enterpriseIntelligenceApi.getSupplyDemand(),
    refetchInterval: 300000,
  });
}

export function useCategoryMomentum() {
  return useQuery({
    queryKey: ['enterprise-intelligence', 'category-momentum'],
    queryFn: () => enterpriseIntelligenceApi.getCategoryMomentum(),
    refetchInterval: 300000,
  });
}

export function useRegionalHeatmap() {
  return useQuery({
    queryKey: ['enterprise-intelligence', 'regional-heatmap'],
    queryFn: () => enterpriseIntelligenceApi.getRegionalHeatmap(),
    refetchInterval: 300000,
  });
}

export function useGrowthVelocity() {
  return useQuery({
    queryKey: ['enterprise-intelligence', 'growth-velocity'],
    queryFn: () => enterpriseIntelligenceApi.getGrowthVelocity(),
    refetchInterval: 300000,
  });
}

export function useTrustDistribution() {
  return useQuery({
    queryKey: ['enterprise-intelligence', 'trust-distribution'],
    queryFn: () => enterpriseIntelligenceApi.getTrustDistribution(),
    refetchInterval: 300000,
  });
}

export function usePredictions() {
  return useQuery({
    queryKey: ['enterprise-intelligence', 'predictions'],
    queryFn: () => enterpriseIntelligenceApi.getPredictions(),
    refetchInterval: 300000,
  });
}

export function useOpportunities() {
  return useQuery({
    queryKey: ['enterprise-intelligence', 'opportunities'],
    queryFn: () => enterpriseIntelligenceApi.getOpportunities(),
    refetchInterval: 300000,
  });
}

export function useRisks() {
  return useQuery({
    queryKey: ['enterprise-intelligence', 'risks'],
    queryFn: () => enterpriseIntelligenceApi.getRisks(),
    refetchInterval: 300000,
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ['enterprise-intelligence', 'recommendations'],
    queryFn: () => enterpriseIntelligenceApi.getRecommendations(),
    refetchInterval: 300000,
  });
}

export function useEnterpriseAnalytics() {
  return useQuery({
    queryKey: ['enterprise-intelligence', 'analytics'],
    queryFn: () => enterpriseIntelligenceApi.getAnalytics(),
    refetchInterval: 300000,
  });
}
