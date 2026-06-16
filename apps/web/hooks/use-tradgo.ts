import { useQuery } from '@tanstack/react-query';
import { getTradgoRaces, getTradgoBadges, getLeaderboard } from '@/lib/api/tradgo';

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
