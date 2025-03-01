
/**
 * Simple in-memory cache for analysis results
 */

import { AnalysisResult } from './types.ts';

// Cache of analysis results to avoid redundant processing
const resultCache: Map<string, { result: AnalysisResult; timestamp: number }> = new Map();

// Cache expiration time in milliseconds (1 hour)
const CACHE_EXPIRATION = 60 * 60 * 1000;

/**
 * Retrieves a cached analysis result if available and not expired
 */
export function getCachedResult(url: string): AnalysisResult | null {
  // Normalize the URL for consistent cache keys
  const normalizedUrl = url.toLowerCase().trim();
  
  const cachedEntry = resultCache.get(normalizedUrl);
  
  if (!cachedEntry) {
    return null;
  }
  
  const { result, timestamp } = cachedEntry;
  const currentTime = Date.now();
  
  // Check if the cache entry has expired
  if (currentTime - timestamp > CACHE_EXPIRATION) {
    // Remove expired entry
    resultCache.delete(normalizedUrl);
    return null;
  }
  
  return result;
}

/**
 * Caches an analysis result for future use
 */
export function cacheResult(url: string, result: AnalysisResult): void {
  // Normalize the URL for consistent cache keys
  const normalizedUrl = url.toLowerCase().trim();
  
  // Add the result to the cache with the current timestamp
  resultCache.set(normalizedUrl, {
    result,
    timestamp: Date.now()
  });
  
  // Cleanup old entries if the cache gets too large
  if (resultCache.size > 1000) {
    cleanupCache();
  }
}

/**
 * Cleans up old or expired cache entries
 */
function cleanupCache(): void {
  const currentTime = Date.now();
  
  // Find and remove expired entries
  for (const [url, { timestamp }] of resultCache.entries()) {
    if (currentTime - timestamp > CACHE_EXPIRATION) {
      resultCache.delete(url);
    }
  }
  
  // If the cache is still too large, remove the oldest entries
  if (resultCache.size > 500) {
    const entries = [...resultCache.entries()];
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove the oldest half of entries
    const entriesToRemove = entries.slice(0, Math.floor(entries.length / 2));
    for (const [url] of entriesToRemove) {
      resultCache.delete(url);
    }
  }
}
