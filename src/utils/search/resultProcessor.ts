
import { Result } from '@/components/ResultsTable';

export interface PlacesResult {
  results: Result[];
  hasMore: boolean;
  nextPageToken?: string;
  searchId?: string;
  totalResults?: number;
}

// Process search results into the format expected by the application
export const processSearchResults = (data: any): PlacesResult => {
  if (!data || !data.results || !Array.isArray(data.results)) {
    console.error('Invalid response format or empty results:', data);
    return {
      results: [],
      hasMore: false
    };
  }

  // Map the results to the expected format and ensure there are no undefined entries
  const formattedResults = data.results
    .filter((result: any) => result && result.url) // Only include results with URLs
    .map((result: any) => ({
      url: result.url,
      status: 'Ready for analysis',
      details: {
        title: result.details?.title || result.title || '',
        description: result.details?.description || result.description || '',
        lastChecked: new Date().toISOString(),
        // Include additional details if available
        phone: result.details?.phone,
        rating: result.details?.rating,
        reviewCount: result.details?.reviewCount,
        businessType: result.details?.businessType,
        priceLevel: result.details?.priceLevel,
        openingHours: result.details?.openingHours,
        location: result.details?.location,
        photoReference: result.details?.photoReference,
        placeId: result.details?.placeId
      }
    }));

  console.log('Formatted results count:', formattedResults.length);
  if (formattedResults.length > 0) {
    console.log('Sample formatted result:', formattedResults[0]);
  }

  // Calculate hasMore flag - pay special attention to this logic
  let hasMoreResults = false;
  
  // Check for explicit hasMore flag
  if (data.hasMore !== undefined) {
    hasMoreResults = Boolean(data.hasMore);
  } 
  // Check for nextPageToken (indicates more results are available)
  else if (data.nextPageToken) {
    hasMoreResults = true;
  }
  // Check total vs. current count if available
  else if (data.totalResults !== undefined && data.totalResults > formattedResults.length) {
    hasMoreResults = true;
  }

  console.log('hasMore flag set to:', hasMoreResults, 'based on data:', {
    explicitHasMore: data.hasMore,
    nextPageToken: !!data.nextPageToken,
    totalResults: data.totalResults,
    currentCount: formattedResults.length
  });
  
  // Add search metadata
  const returnValue: PlacesResult = {
    results: formattedResults,
    hasMore: hasMoreResults
  };
  
  // Add pagination-related data if available
  if (data.nextPageToken) {
    returnValue.nextPageToken = data.nextPageToken;
    console.log('Next page token available:', data.nextPageToken.substring(0, 10) + '...');
  }
  
  if (data.searchId) {
    returnValue.searchId = data.searchId;
  }
  
  if (data.totalResults !== undefined) {
    returnValue.totalResults = data.totalResults;
  }
  
  return returnValue;
};
