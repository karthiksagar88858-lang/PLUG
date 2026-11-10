/**
 * Scale and High-Concurrency Utilities
 * Designed to handle 30,000+ concurrent campus users with sub-millisecond in-memory cache,
 * in-flight request deduplication (thundering herd protection), and sliding-window rate limiting.
 */

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export class TTLCache<T> {
  private store = new Map<string, { value: T; expiresAt: number }>();
  private hits = 0;
  private misses = 0;
  private maxItems: number;
  private defaultTTLMs: number;

  constructor(maxItems: number = 2000, defaultTTLMs: number = 10 * 60 * 1000) {
    this.maxItems = maxItems;
    this.defaultTTLMs = defaultTTLMs;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this.store.size >= this.maxItems) {
      // Evict oldest entry
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }

    const expiresAt = Date.now() + (ttlMs || this.defaultTTLMs);
    this.store.set(key, { value, expiresAt });
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  clear(): void {
    this.store.clear();
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.store.size,
      hitRate: total === 0 ? 0 : Math.round((this.hits / total) * 100),
    };
  }
}

/**
 * In-Flight Request Deduplicator
 * When hundreds of users simultaneously query the same item or prompt,
 * collates identical requests into a single promise to prevent AI quota exhaustion.
 */
export class RequestDeduplicator<T> {
  private inFlight = new Map<string, Promise<T>>();

  async execute(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing;
    }

    const promise = fn().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }

  inFlightCount(): number {
    return this.inFlight.size;
  }
}

/**
 * Sliding Window In-Memory Rate Limiter
 * Ensures fairness across 30,000 concurrent users without needing an external Redis instance.
 */
export class SlidingWindowRateLimiter {
  private windows = new Map<string, number[]>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 60, windowMs: number = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(clientId: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    const timestamps = this.windows.get(clientId) || [];

    // Filter out timestamps outside the window
    const valid = timestamps.filter((t) => now - t < this.windowMs);

    if (valid.length >= this.maxRequests) {
      const oldest = valid[0];
      const resetMs = this.windowMs - (now - oldest);
      this.windows.set(clientId, valid);
      return { allowed: false, remaining: 0, resetMs: Math.max(0, resetMs) };
    }

    valid.push(now);
    this.windows.set(clientId, valid);
    return {
      allowed: true,
      remaining: this.maxRequests - valid.length,
      resetMs: this.windowMs,
    };
  }

  reset(): void {
    this.windows.clear();
  }
}
