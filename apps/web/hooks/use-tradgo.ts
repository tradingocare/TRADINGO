import { useQuery } from '@tanstack/react-query';
import { getTradgoRaces, getTradgoBadges, getLeaderboard, getUnifiedBadges, getTrustSignals, getUnifiedRanking, getCityRankings, getStateRankings, getCategoryRankings } from '@/lib/api/tradgo';

export function useTradgoRaces() {
  return useQuery({
    queryKey: ['tradgo', 'races'],
    queryFn: getTradgoRaces,
  });
}

export function useTradgoBadges() {
  return useQuery({
    queryKey: ['tradgo', 'badges'],
    queryFn: getTradgoBadges,
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['tradgo', 'leaderboard'],
    queryFn: getLeaderboard,
  });
}

export function useUnifiedBadges() {
  return useQuery({
    queryKey: ['tradgo', 'unified-badges'],
    queryFn: getUnifiedBadges,
  });
}

export function useTrustSignals() {
  return useQuery({
    queryKey: ['tradgo', 'trust-signals'],
    queryFn: getTrustSignals,
  });
}

export function useUnifiedRanking() {
  return useQuery({
    queryKey: ['tradgo', 'unified-ranking'],
    queryFn: getUnifiedRanking,
    retry: false,
  });
}

export function useCityRankings(city: string, limit?: number) {
  return useQuery({
    queryKey: ['tradgo', 'city-rankings', city, limit],
    queryFn: () => getCityRankings(city, limit),
    enabled: !!city,
  });
}

export function useStateRankings(state: string, limit?: number) {
  return useQuery({
    queryKey: ['tradgo', 'state-rankings', state, limit],
    queryFn: () => getStateRankings(state, limit),
    enabled: !!state,
  });
}

export function useCategoryRankings(categoryId: string, limit?: number) {
  return useQuery({
    queryKey: ['tradgo', 'category-rankings', categoryId, limit],
    queryFn: () => getCategoryRankings(categoryId, limit),
    enabled: !!categoryId,
  });
}
