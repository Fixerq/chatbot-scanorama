
/**
 * Simple in-memory cache for analysis results
 */

interface CachedResult {
  url: string;
  hasChatbot: boolean;
  solutions: string[];
  status: string;
  confidence?: number;
  verificationStatus?: 'verified' | 'unverified' | 'failed';
  lastChecked: string;
  cacheExpiry: number; // Timestamp when cache expires
}

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// In-memory cache for results
const analysisCache = new Map<string, CachedResult>();

/**
 * Get cached result for a URL if it exists and is valid
 */
export const getCachedResult = async (url: string): Promise<CachedResult | null> => {
  const cachedResult = analysisCache.get(url);
  
  if (cachedResult) {
    // Check if cache is still valid
    if (Date.now() < cachedResult.cacheExpiry) {
      console.log(`Cache hit for ${url}`);
      return cachedResult;
    } else {
      // Cache expired, remove it
      analysisCache.delete(url);
      console.log(`Cache expired for ${url}`);
    }
  }
  
  return null;
};

/**
 * Cache analysis result for future use
 */
export const cacheResult = async (url: string, result: any): Promise<void> => {
  const cacheExpiry = Date.now() + CACHE_DURATION;
  
  analysisCache.set(url, {
    ...result,
    cacheExpiry
  });
  
  console.log(`Cached result for ${url} until ${new Date(cacheExpiry).toISOString()}`);
};
