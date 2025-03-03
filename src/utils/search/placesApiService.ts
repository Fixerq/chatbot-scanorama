
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
  startIndex?: number,
  pageToken?: string
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
        pageToken,
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

      // Prepare the request body
      const requestBody: any = {
        query: enhancedQuery,
        country,
        region,
        limit: 20, // Maximum allowed by Places API
        include_details: true,
        client_timestamp: requestTimestamp
      };
      
      // Add pageToken if available for pagination - this is critical for token-based pagination
      if (pageToken) {
        requestBody.pageToken = pageToken;
        console.log('Including pageToken in request:', pageToken);
      } else if (startIndex && startIndex > 0) {
        // Only use startIndex if no pageToken is available (legacy option)
        requestBody.startIndex = startIndex;
      }

      console.log('Sending request to Edge Function with body:', JSON.stringify(requestBody, null, 2));

      // Try normal request first
      try {
        // Attempt to call the edge function with increased timeout
        const { data, error } = await supabase.functions.invoke('search-places', {
          body: requestBody,
          headers: {
            'Prefer': 'return=representation, count=exact',
          }
        });

        if (error) {
          console.error('Edge function error:', error);
          const shouldRetry = handleSearchError(error, retryCount, maxRetries);
          if (shouldRetry) {
            retryCount++;
            continue;
          }
          // If all retries have been exhausted, try test mode as last resort
          if (retryCount === maxRetries - 1) {
            console.log('Trying test mode as last resort');
            // Add test mode to the request
            const testRequestBody = { ...requestBody, testMode: true };
            const { data: testData, error: testError } = await supabase.functions.invoke('search-places', {
              body: testRequestBody,
              headers: {
                'Prefer': 'return=representation, count=exact',
              }
            });
            
            if (testError) {
              console.error('Test mode also failed:', testError);
              return null;
            }
            
            console.log('Test mode returned data:', testData);
            return processSearchResults(testData);
          }
          return null;
        }

        // Check for errors in the response
        if (data?.error) {
          console.error('Data error from Edge Function:', data.error, data.details || 'No details provided');
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
        
        // Process the results and store nextPageToken if available
        const processedResults = processSearchResults(data);
        if (data.nextPageToken) {
          console.log('Received page token for pagination:', data.nextPageToken);
          processedResults.nextPageToken = data.nextPageToken;
        }
        
        return processedResults;
      } catch (networkError) {
        console.error('Network error during search:', networkError);
        
        // If we encounter a network error (like net::ERR_FAILED), try test mode
        console.log('Network error occurred, trying test mode');
        try {
          const testRequestBody = { ...requestBody, testMode: true };
          const { data: testData, error: testError } = await supabase.functions.invoke('search-places', {
            body: testRequestBody,
            headers: {
              'Prefer': 'return=representation, count=exact',
            }
          });
          
          if (testError) {
            console.error('Test mode also failed:', testError);
            retryCount++;
            continue;
          }
          
          console.log('Test mode returned data:', testData);
          return processSearchResults(testData);
        } catch (testModeError) {
          console.error('Test mode also failed with network error:', testModeError);
          retryCount++;
          continue;
        }
      }
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
