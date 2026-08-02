import { Injectable, Logger } from '@nestjs/common';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface GeoCacheEntry {
  lat: number;
  lng: number;
  formatted: string;
  cachedAt: number;
}

@Injectable()
export class GeoCacheService {
  private readonly logger = new Logger(GeoCacheService.name);
  private readonly cache = new Map<string, GeoCacheEntry>();

  get(addressKey: string): GeoCacheEntry | null {
    const entry = this.cache.get(addressKey);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      this.cache.delete(addressKey);
      return null;
    }
    return entry;
  }

  set(addressKey: string, entry: Omit<GeoCacheEntry, 'cachedAt'>): void {
    this.cache.set(addressKey, { ...entry, cachedAt: Date.now() });
  }

  getStats(): { size: number; keys: string[] } {
    return { size: this.cache.size, keys: [...this.cache.keys()] };
  }
}
