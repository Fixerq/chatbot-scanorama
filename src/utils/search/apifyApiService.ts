import { Result } from '@/components/ResultsTable';
import { callApifyApi } from './api/apifyApi';
import { handleApifyApiError } from './errors/apifyErrors';
import { processApifyResults } from './processing/resultsProcessor';
import { toast } from 'sonner';

// Export these interfaces so they can be used in index.ts
export interface ApifySearchOptions {
  query: string;
  country: string;
  region: string;
  limit?: number;
  pageToken?: string;
  existingPlaceIds?: string[];
  apiKey?: string;
}

export interface ApifySearchResponse {
  results: Result[];
  nextPageToken?: string;
  hasMore: boolean;
}

export const performApifySearch = async (options: ApifySearchOptions): Promise<ApifySearchResponse | null> => {
  try {
    const response = await callApifyApi(options);
    
    if (!response) {
      return null;
    }
    
    if (response.results.length === 0) {
      toast.info('No results found.', {
        description: 'Try broadening your search criteria or searching for a different term.'
      });
    }
    
    return response;
  } catch (error) {
    handleApifyApiError(error);
    return null;
  }
};

export const loadMoreResults = async (
  query: string,
  country: string,
  region: string,
  apiKey: string,
  pageToken?: string,
  existingResults: Result[] = []
): Promise<ApifySearchResponse | null> => {
  try {
    // Get all existing place IDs for deduplication
    const existingPlaceIds = existingResults
      .filter(result => result.id)
      .map(result => result.id);
    
    // Make the request for the next page
    const response = await performApifySearch({
      query,
      country,
      region,
      pageToken,
      existingPlaceIds,
      apiKey
    });
    
    if (!response) {
      return null;
    }
    
    // Process and deduplicate results
    const processedResults = processApifyResults(response.results, existingResults);
    
    return {
      results: processedResults,
      nextPageToken: response.nextPageToken,
      hasMore: response.hasMore
    };
  } catch (error) {
    handleApifyApiError(error);
    return null;
  }
};