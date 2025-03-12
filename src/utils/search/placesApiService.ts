
import { Result } from '@/components/ResultsTable';
import { callPlacesApi } from './api/placesApi';
import { handlePlacesApiError } from './errors/placesErrors';
import { processPlacesResults } from './processing/resultsProcessor';
import { toast } from 'sonner';

interface PlacesSearchOptions {
  query: string;
  country: string;
  region: string;
  limit?: number;
  pageToken?: string;
  existingPlaceIds?: string[];
  apiKey?: string;
}

interface PlacesSearchResponse {
  results: Result[];
  nextPageToken?: string;
  hasMore: boolean;
}

export const performPlacesSearch = async (options: PlacesSearchOptions): Promise<PlacesSearchResponse | null> => {
  try {
    const response = await callPlacesApi(options);
    
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
    handlePlacesApiError(error);
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
): Promise<PlacesSearchResponse | null> => {
  try {
    // Get all existing place IDs for deduplication
    const existingPlaceIds = existingResults
      .filter(result => result.id)
      .map(result => result.id);
    
    // Make the request for the next page
    const response = await performPlacesSearch({
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
    const processedResults = processPlacesResults(response.results, existingResults);
    
    return {
      results: processedResults,
      nextPageToken: response.nextPageToken,
      hasMore: response.hasMore
    };
  } catch (error) {
    handlePlacesApiError(error);
    return null;
  }
};
