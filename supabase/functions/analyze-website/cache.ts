
// Simple in-memory cache implementation
interface CacheEntry {
  data: any;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly defaultTtl: number; // Time to live in milliseconds

  constructor(defaultTtlMinutes = 60) {
    this.defaultTtl = defaultTtlMinutes * 60 * 1000;
    
    // Setup periodic cleanup of expired entries
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  get(key: string): any {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: any, ttlMinutes?: number): void {
    const ttl = (ttlMinutes || this.defaultTtl / 60000) * 60 * 1000;
    const expiresAt = Date.now() + ttl;
    
    this.cache.set(key, { data, expiresAt });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Create and export a singleton instance
export const cache = new SimpleCache();
