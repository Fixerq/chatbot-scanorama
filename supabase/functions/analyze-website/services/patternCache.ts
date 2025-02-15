
interface CacheEntry {
  patterns: any[];
  timestamp: number;
}

let patternCache: CacheEntry | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedPatterns(): any[] | null {
  if (!patternCache || Date.now() - patternCache.timestamp > CACHE_TTL) {
    return null;
  }
  return patternCache.patterns;
}

export function setCachedPatterns(patterns: any[]): void {
  patternCache = {
    patterns,
    timestamp: Date.now()
  };
}
