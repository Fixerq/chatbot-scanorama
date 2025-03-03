
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

  // Add search metadata
  const returnValue: PlacesResult = {
    results: formattedResults,
    hasMore: data.hasMore || false
  };
  
  // Add pagination-related data if available
  if (data.nextPageToken) {
    returnValue.nextPageToken = data.nextPageToken;
  }
  
  if (data.searchId) {
    returnValue.searchId = data.searchId;
  }
  
  if (data.totalResults !== undefined) {
    returnValue.totalResults = data.totalResults;
  }
  
  return returnValue;
};
