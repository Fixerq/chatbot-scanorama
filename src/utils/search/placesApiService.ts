
import { supabase } from '@/integrations/supabase/client';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';

interface PlacesSearchOptions {
  query: string;
  country: string;
  region: string;
  limit?: number;
  pageToken?: string;
  existingPlaceIds?: string[];
}

interface PlacesSearchResponse {
  results: Result[];
  nextPageToken?: string;
  hasMore: boolean;
}

/**
 * Performs a search using the Google Places API
 */
export const performPlacesSearch = async (options: PlacesSearchOptions): Promise<PlacesSearchResponse | null> => {
  let retryCount = 0;
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second
  
  while (retryCount < maxRetries) {
    try {
      console.log('Performing Places search with params:', JSON.stringify({
        query: options.query,
        country: options.country,
        region: options.region,
        limit: options.limit,
        pageToken: options.pageToken ? 'present' : 'not present',
        existingPlaceIds: options.existingPlaceIds ? options.existingPlaceIds.length : 0,
        retryAttempt: retryCount
      }, null, 2));

      // Attempt to call the edge function
      const { data, error } = await supabase.functions.invoke('search-places', {
        body: options
      });

      if (error) {
        console.error('Places search error:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          statusCode: error.status
        });

        // If we get a non-200 error, retry after a delay
        if (retryCount < maxRetries - 1) {
          console.log(`Got error, retrying in ${retryDelay * (retryCount + 1)}ms... (attempt ${retryCount + 1} of ${maxRetries})`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
          continue;
        }
        
        // All retries failed
        if (error.message.includes('API key')) {
          toast.error('Google Places API key is missing or invalid. Please check your configuration.', { 
            description: 'Contact your administrator to resolve this issue.'
          });
        } else {
          toast.error('Search service is currently unavailable.', { 
            description: 'Please try again later or try a different search.'
          });
        }
        return null;
      }

      // Check for errors in the response
      if (data?.error) {
        console.error('Places search API error:', data.error);
        console.error('Error details:', data.details || 'No details provided');
        
        // If we have more retries left, try again
        if (retryCount < maxRetries - 1) {
          console.log(`Got API error, retrying in ${retryDelay * (retryCount + 1)}ms... (attempt ${retryCount + 1} of ${maxRetries})`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
          continue;
        }
        
        // All retries failed with API errors
        if (data.status === 'api_error') {
          toast.error('Error from Google Places API.', { 
            description: 'Please check your search terms and try again with a more specific location.'
          });
        } else {
          toast.error('Search service encountered an error.', { 
            description: 'Please try again later or modify your search.'
          });
        }
        return null;
      }

      console.log('Raw response from Edge Function:', JSON.stringify(data, null, 2));
      console.log('Results count:', data?.results?.length || 0);
      
      // Check if there are results but they don't appear to be properly formatted
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        console.log('Successfully processed results:', data.results.length);
      } else if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        // This handles the case where the edge function might return data in an unexpected format
        console.log('Data structure received:', Object.keys(data));
      }
      
      // Ensure data.results is always an array even if we get unexpected response format
      const results = Array.isArray(data?.results) ? data.results : [];
      
      if (results.length === 0) {
        console.log('No results found. Check if search criteria may be too restrictive.');
        toast.info('No results found.', {
          description: 'Try broadening your search criteria or searching for a different term.'
        });
      }
      
      // Add nextPageToken to response metadata for each result
      if (results.length > 0 && data.nextPageToken) {
        const resultsWithMetadata = results.map(result => ({
          ...result,
          _metadata: {
            nextPageToken: data.nextPageToken
          }
        }));
        
        return {
          results: resultsWithMetadata,
          nextPageToken: data.nextPageToken,
          hasMore: data.hasMore || false
        };
      }
      
      return {
        results: results,
        nextPageToken: data?.nextPageToken,
        hasMore: data?.hasMore || false
      };
    } catch (error) {
      console.error('Places search error:', error);
      retryCount++;
      
      if (retryCount < maxRetries) {
        console.log(`Retrying search in ${retryDelay * retryCount}ms... (attempt ${retryCount} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
      } else {
        // All retries failed
        console.error('Search failed after maximum retries');
        toast.error('Search failed. Please try again later or refine your search criteria.');
        return null;
      }
    }
  }
  
  // If we've exhausted all retries, return null
  console.error('Search failed after maximum retries');
  toast.error('Search failed. Please try again later.');
  return null;
};

/**
 * Loads more results for an existing search
 */
export const loadMoreResults = async (
  query: string,
  country: string,
  region: string,
  existingResults: Result[]
): Promise<PlacesSearchResponse | null> => {
  // Get the nextPageToken from the existing results
  let nextPageToken = null;
  
  if (existingResults.length > 0) {
    const lastResult = existingResults[existingResults.length - 1];
    nextPageToken = lastResult._metadata?.nextPageToken;
  }
  
  if (!nextPageToken) {
    console.log('No page token found for loading more results');
    return {
      results: [],
      hasMore: false
    };
  }
  
  // Get all existing place IDs for deduplication
  const existingPlaceIds = existingResults
    .filter(result => result.id)
    .map(result => result.id);
  
  // Make the request for the next page
  return performPlacesSearch({
    query,
    country,
    region,
    pageToken: nextPageToken,
    existingPlaceIds
  });
};

// Export the interfaces for external use
export type { PlacesSearchOptions, PlacesSearchResponse };
