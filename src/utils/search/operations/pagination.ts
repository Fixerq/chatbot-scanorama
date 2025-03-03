import { Result } from '@/components/ResultsTable';
import { performGoogleSearch } from '../placesApiService';
import { toast } from 'sonner';
import { enhanceSearchQuery } from './enhancer';

/**
 * Loads more results from the search API
 */
export const loadMore = async (
  query: string,
  country: string,
  region: string,
  currentResults: Result[],
  targetResultCount: number
): Promise<{ newResults: Result[]; hasMore: boolean } | null> => {
  try {
    const startIndex = currentResults.length;
    console.log(`Loading more results with startIndex: ${startIndex}, target: ${targetResultCount}`);
    
    // Get the searchId from localStorage for this query
    const searchId = localStorage.getItem(`currentSearchId_${query}`);
    if (!searchId) {
      console.error("No search ID found for pagination");
      toast.error("Unable to load more results. Please try a new search.");
      return null;
    }
    
    console.log(`Using search ID for pagination: ${searchId}`);
    
    // Get the next page token if available
    const nextPageToken = localStorage.getItem(`searchPageToken_${query}_${country}_${region}`);
    console.log('Using page token for pagination:', nextPageToken);
    
    // Calculate the current page number (0-indexed)
    const currentPage = Math.floor(startIndex / 20) + 1;
    
    // Add chatbot-specific terms to improve results, but keep it lightweight
    const chatbotTerms = "website customer service support contact";
    const enhancedQuery = await enhanceSearchQuery(query, country, region);
    const finalQuery = `${enhancedQuery} ${chatbotTerms}`;
    
    // Fetch the next page of results
    const searchResult = await performGoogleSearch(
      finalQuery, 
      country, 
      region, 
      startIndex, 
      nextPageToken || searchId // Use either token or searchId
    );
    
    if (!searchResult || !searchResult.results) {
      console.log('No more results found');
      return { newResults: [], hasMore: false };
    }
    
    // Process "No website" placeholders
    const processedResults = searchResult.results.map(result => {
      if (result.url === 'https://example.com/no-website') {
        return {
          ...result,
          details: {
            ...result.details,
            title: `${result.details?.title || ''} (No website)`,
            description: `${result.details?.description || ''} - This business was found in search but has no website.`,
          }
        };
      }
      return result;
    });

    // Create a Set of existing URLs (in lowercase for case-insensitive comparison)
    const existingUrls = new Set(currentResults.map(r => r.url.toLowerCase()));
    
    // Filter out duplicates using case-insensitive comparison
    const newResults = processedResults.filter(result => {
      const lowerCaseUrl = result.url.toLowerCase();
      return !existingUrls.has(lowerCaseUrl) && lowerCaseUrl !== 'https://example.com/no-website';
    });

    console.log(`Loaded ${searchResult.results.length} results, ${newResults.length} new after filtering duplicates`);
    
    // Determine if there are more results available
    const hasMore = searchResult.hasMore;
    console.log(`Has more results: ${hasMore}`);
    
    return {
      newResults,
      hasMore
    };
  } catch (error) {
    console.error('Load more error:', error);
    toast.error('Failed to load more results');
    return null;
  }
};
