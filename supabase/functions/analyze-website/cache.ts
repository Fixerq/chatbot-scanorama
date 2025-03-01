
/**
 * Simple cache implementation for website analysis results
 */

interface CacheEntry {
  url: string;
  result: any;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache to reduce repeated analysis of the same sites
const analysisCache = new Map<string, CacheEntry>();

// Cache expiration in milliseconds (default: 24 hours)
const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Get cached analysis result if it exists and is not expired
 */
export function getCachedResult(url: string): any | null {
  const entry = analysisCache.get(url);
  
  if (!entry) {
    return null;
  }
  
  // Check if cache has expired
  if (Date.now() > entry.expiresAt) {
    analysisCache.delete(url);
    return null;
  }
  
  return entry.result;
}

/**
 * Store analysis result in cache
 */
export function cacheResult(url: string, result: any, ttl: number = DEFAULT_CACHE_TTL): void {
  const timestamp = Date.now();
  const expiresAt = timestamp + ttl;
  
  analysisCache.set(url, {
    url,
    result,
    timestamp,
    expiresAt
  });
}

/**
 * Clear all cached results or for a specific URL
 */
export function clearCache(url?: string): void {
  if (url) {
    analysisCache.delete(url);
  } else {
    analysisCache.clear();
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number, entries: { url: string, age: number }[] } {
  const entries = Array.from(analysisCache.entries()).map(([url, entry]) => ({
    url,
    age: Math.floor((Date.now() - entry.timestamp) / 1000) // Age in seconds
  }));
  
  return {
    size: analysisCache.size,
    entries
  };
}
