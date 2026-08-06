import { Injectable } from '@nestjs/common'

interface CacheEntry {
  value: any
  expiresAt: number
}

@Injectable()
export class AiMemoryService {
  private cache = new Map<string, CacheEntry>()
  private readonly DEFAULT_TTL = 10 * 60 * 1000
  private readonly MAX_SIZE = 1000
  private hits = 0
  private misses = 0

  get(key: string): any | undefined {
    const entry = this.cache.get(key)
    if (!entry) {
      this.misses++
      return undefined
    }
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.misses++
      return undefined
    }
    this.hits++
    return entry.value
  }

  set(key: string, value: any, ttl?: number): void {
    if (this.cache.size >= this.MAX_SIZE && !this.cache.has(key)) {
      const oldest = this.cache.keys().next().value
      if (oldest) this.cache.delete(oldest)
    }
    this.cache.set(key, { value, expiresAt: Date.now() + (ttl ?? this.DEFAULT_TTL) })
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }

  getStats() {
    const total = this.hits + this.misses
    return {
      size: this.cache.size,
      maxSize: this.MAX_SIZE,
      hitRate: total > 0 ? this.hits / total : 0,
      missRate: total > 0 ? this.misses / total : 0,
      hits: this.hits,
      misses: this.misses,
    }
  }
}
