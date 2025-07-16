
import { Result } from '@/components/ResultsTable';
import { performApifySearch, loadMoreResults } from './apifyApiService';
import { toast } from 'sonner';

/**
 * Executes a search using the Apify API
 */
export const executeSearch = async (
  query: string,
  country: string,
  region: string,
  apiKey: string,
  resultsLimit: number,
  existingResults: Result[] = []
): Promise<{ newResults: Result[], hasMore: boolean, nextPageToken?: string } | null> => {
  try {
    // Add region to query if not already present
    let enhancedQuery = query;
    if (region && !query.toLowerCase().includes(region.toLowerCase())) {
      enhancedQuery = `${query} ${region}`;
    }

    const searchResponse = await performApifySearch({
      query: enhancedQuery,
      country,
      region,
      limit: resultsLimit,
      apiKey
    });

    if (!searchResponse) {
      return null;
    }

    // Add metadata to results for client-side pagination
    const results = searchResponse.results.map(result => ({
      ...result,
      _metadata: {
        nextPageToken: searchResponse.nextPageToken,
        searchId: new Date().getTime().toString()
      },
      _searchMetadata: {
        query,
        country,
        region,
        apiKey
      }
    }));

    return {
      newResults: results,
      hasMore: searchResponse.hasMore,
      nextPageToken: searchResponse.nextPageToken
    };
  } catch (error) {
    console.error('Execute search error:', error);
    return null;
  }
};

/**
 * Loads more results for an existing search
 */
export const loadMore = async (
  query: string,
  country: string,
  region: string,
  apiKey: string,
  currentResults: Result[],
  targetResultsCount: number
): Promise<{ newResults: Result[], hasMore: boolean } | null> => {
  try {
    console.log('Loading more results:', { 
      query, 
      country, 
      region, 
      currentCount: currentResults.length, 
      targetCount: targetResultsCount 
    });

    // If we already have enough results, no need to load more
    if (currentResults.length >= targetResultsCount) {
      console.log('Already have enough results, no need to load more');
      return {
        newResults: [],
        hasMore: false
      };
    }

    // Get the metadata from the most recent result to use for pagination
    let pageToken = null;
    
    // First, check the last result for a token
    if (currentResults.length > 0) {
      const lastResult = currentResults[currentResults.length - 1];
      if (lastResult._metadata?.nextPageToken) {
        pageToken = lastResult._metadata.nextPageToken;
      }
    }
    
    // If we don't have a token, try to find one in any of the results (in case they're not ordered)
    if (!pageToken) {
      for (const result of currentResults) {
        if (result._metadata?.nextPageToken) {
          pageToken = result._metadata.nextPageToken;
          break;
        }
      }
    }

    // Load more results
    const moreResults = await loadMoreResults(
      query,
      country,
      region,
      apiKey,
      pageToken,
      currentResults
    );

    if (!moreResults) {
      console.error('Failed to load more results');
      return null;
    }

    console.log(`Loaded ${moreResults.results.length} more results`);

    // Add metadata to results
    const results = moreResults.results.map(result => ({
      ...result,
      _metadata: {
        nextPageToken: moreResults.nextPageToken
      },
      _searchMetadata: {
        query,
        country,
        region,
        apiKey
      }
    }));

    return {
      newResults: results,
      hasMore: moreResults.hasMore
    };
  } catch (error) {
    console.error('Load more error:', error);
    return null;
  }
};

/**
 * Processes search results
 */
export const processSearchResults = (data: any): { 
  results: Result[], 
  hasMore: boolean, 
  nextPageToken?: string 
} => {
  if (!data || !data.results) {
    return { results: [], hasMore: false };
  }

  return {
    results: data.results,
    hasMore: data.hasMore || false,
    nextPageToken: data.nextPageToken
  };
};
