import { apiClient } from './client';

export interface PlatformStats {
  productsListed: number;
  activeTraders: number;
  liveRfqs: number;
  ordersCompleted: number;
  citiesCovered: number;
}

export interface CityStat {
  city: string;
  state: string;
  companyCount: number;
}

export interface StateStat {
  state: string;
  companyCount: number;
  cityCount: number;
}

export function getPlatformStats() {
  return apiClient.get<PlatformStats>('/public/platform-stats').then(r => r.data);
}

export function getCityStats() {
  return apiClient.get<CityStat[]>('/public/city-stats').then(r => r.data);
}

export function getStateStats() {
  return apiClient.get<StateStat[]>('/public/state-stats').then(r => r.data);
}
