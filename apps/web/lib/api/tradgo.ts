import { apiClient } from './client';
import type { TradgoRace, TradgoBadge } from './types';

export function getTradgoRaces() {
  return apiClient.get<TradgoRace[]>('/tradgo/races').then(r => r.data);
}

export function getTradgoBadges() {
  return apiClient.get<TradgoBadge[]>('/tradgo/badges').then(r => r.data);
}

export function getLeaderboard() {
  return apiClient.get<any[]>('/tradgo/leaderboard').then(r => r.data);
}
