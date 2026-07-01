import { apiClient } from './client';
import type { TradgoRace, TradgoBadge, LeaderboardEntry } from './types';

export function getTradgoRaces() {
  return apiClient.get<TradgoRace[]>('/tradgo/races').then(r => r.data);
}

export function getTradgoBadges() {
  return apiClient.get<TradgoBadge[]>('/tradgo/badges').then(r => r.data);
}

export function getLeaderboard() {
  return apiClient.get<LeaderboardEntry[]>('/tradgo/leaderboard').then(r => r.data);
}

export interface UnifiedBadge {
  badge: string;
  earned: boolean;
  label: string;
  description: string;
}

export interface TrustSignals {
  trustScore: number;
  verificationLevel: string;
  companyStatus: string;
  totalProducts: number;
  responseRate: number;
  memberSince: string;
  totalOrders: number;
  totalShipments: number;
  totalQuotes: number;
  totalRfqs: number;
  goCashBalance: number;
  goCashLifetimeEarned: number;
  walletStatus: string | null;
}

export function getUnifiedBadges() {
  return apiClient.get<UnifiedBadge[]>('/tradgo/unified-badges').then(r => r.data);
}

export function getTrustSignals() {
  return apiClient.get<TrustSignals>('/tradgo/trust-signals').then(r => r.data);
}

export interface UnifiedRanking {
  companyId: string | null;
  rank: number | null;
  totalEntries: number;
  percentile: number | null;
  trustScore: number | null;
  verificationLevel: string | null;
  totalProducts: number;
  totalOrders: number;
  badges: string[];
}

export interface CityRanking {
  city: string;
  companyCount: number;
  productCount: number;
  topCompanies: Array<{
    rank: number; id: string; name: string; slug: string; logo: string | null;
    trustScore: number; totalProducts: number; verificationLevel: string;
  }>;
  topProducts: Array<{
    id: string; name: string; slug: string; price: number | null; image: string | null;
    companyName: string; companySlug: string; trustScore: number;
  }>;
}

export interface CategoryRanking {
  category: { id: string; name: string };
  totalProducts: number;
  topProducts: Array<{
    id: string; name: string; slug: string; price: number | null; image: string | null;
    companyName: string; companySlug: string; trustScore: number;
  }>;
  topCompanies: Array<{
    rank: number; id: string; name: string; slug: string; logo: string | null;
    trustScore: number; totalProducts: number; verificationLevel: string;
  }>;
}

export function getUnifiedRanking() {
  return apiClient.get<UnifiedRanking>('/tradgo/unified-ranking').then(r => r.data);
}

export function getCityRankings(city: string, limit?: number) {
  return apiClient.get<CityRanking>(`/tradgo/city-rankings/${encodeURIComponent(city)}`, { params: { limit } }).then(r => r.data);
}

export function getStateRankings(state: string, limit?: number) {
  return apiClient.get<CityRanking>(`/tradgo/state-rankings/${encodeURIComponent(state)}`, { params: { limit } }).then(r => r.data);
}

export function getCategoryRankings(categoryId: string, limit?: number) {
  return apiClient.get<CategoryRanking>(`/tradgo/category-rankings/${categoryId}`, { params: { limit } }).then(r => r.data);
}
