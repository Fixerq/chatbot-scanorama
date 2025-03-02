
import { supabase } from '@/integrations/supabase/client';
import { logSearchParams, logResponse, logEnhancedQuery, logRetry, logRequestTimestamp } from './logging';
import { handleSearchError, handleDataError } from './errorHandling';
import { enhanceSearchQuery } from './queryEnhancement';
import { processSearchResults, PlacesResult } from './resultProcessor';
import { RETRY_CONFIG } from './constants';

export const performGoogleSearch = async (
  query: string,
  country: string,
  region: string,
  startIndex?: number
): Promise<PlacesResult | null> => {
  let retryCount = 0;
  const { maxRetries, baseRetryDelay } = RETRY_CONFIG;
  
  while (retryCount < maxRetries) {
    try {
      logSearchParams({
        query,
        country,
        region,
        startIndex,
        retryAttempt: retryCount
      });

      // Enhance the search query
      const enhancedQuery = enhanceSearchQuery(query, country, region);
      logEnhancedQuery(query, enhancedQuery);

      // Calculate exponential backoff delay if we're retrying
      const retryDelay = retryCount > 0 ? baseRetryDelay * Math.pow(2, retryCount - 1) : 0;
      if (retryCount > 0) {
        logRetry(retryCount, retryDelay);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }

      // Add timestamp to help correlate client and server logs
      const requestTimestamp = logRequestTimestamp();

      // Attempt to call the edge function with increased timeout
      const { data, error } = await supabase.functions.invoke('search-places', {
        body: {
          query: enhancedQuery,
          country,
          region,
          startIndex: startIndex || 0,
          limit: 20, // Maximum allowed by Places API v1
          include_details: true,
          client_timestamp: requestTimestamp
        },
        options: {
          // Longer timeout for API calls that might take time
          headers: {
            'Prefer': 'wait=30', // Extend timeout to 30 seconds
          }
        }
      });

      if (error) {
        const shouldRetry = handleSearchError(error, retryCount, maxRetries);
        if (shouldRetry) {
          retryCount++;
          continue;
        }
        return null;
      }

      // Check for errors in the response
      if (data?.error) {
        const shouldRetry = handleDataError(data, retryCount, maxRetries);
        if (shouldRetry) {
          retryCount++;
          continue;
        }
        return null;
      }

      console.log('Raw response from Edge Function:', data);
      logResponse(data);
      
      // Check if data is empty or malformed
      if (!data || !data.results || !Array.isArray(data.results) || data.results.length === 0) {
        console.log("Search returned no results");
        return {
          results: [],
          hasMore: false
        };
      }
      
      return processSearchResults(data);
    } catch (error) {
      console.error('Places search error:', error);
      retryCount++;
      
      // Use exponential backoff for retries
      const exponentialDelay = baseRetryDelay * Math.pow(2, retryCount - 1);
      
      if (retryCount < maxRetries) {
        console.log(`Retrying search in ${exponentialDelay}ms... (attempt ${retryCount} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, exponentialDelay));
      } else {
        // All retries failed
        console.error('Search failed after maximum retries');
        return null;
      }
    }
  }
  
  // If we've exhausted all retries, return null
  console.error('Search failed after maximum retries');
  return null;
};
