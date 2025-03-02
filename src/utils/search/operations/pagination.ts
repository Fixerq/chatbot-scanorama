import { Result } from '@/components/ResultsTable';
import { performGoogleSearch } from '../index';
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
    
    // Add chatbot-specific terms to improve results, but keep it lightweight
    const chatbotTerms = "website customer service support contact";
    const enhancedQuery = await enhanceSearchQuery(query, country, region);
    const finalQuery = `${enhancedQuery} ${chatbotTerms}`;
    
    // Calculate the maximum number of results we need
    const maxNeededResults = Math.max(50, targetResultCount - startIndex);
    
    // First attempt with primary search
    let searchResult = await performGoogleSearch(finalQuery, country, region, startIndex);
    
    // If first attempt returns no results, try different approaches
    if (!searchResult?.results || searchResult.results.length === 0) {
      console.log('No results in first attempt, trying with adjusted parameters');
      
      // Try with a slightly different query formulation (more direct geography)
      const alternateQuery = `${query} in ${region || ''} ${country}`;
      searchResult = await performGoogleSearch(alternateQuery, country, region, Math.max(0, startIndex - 10));
      
      // If that still fails, try one more approach with just the category
      if (!searchResult?.results || searchResult.results.length === 0) {
        console.log('Second attempt failed, trying with more generic search');
        searchResult = await performGoogleSearch(query, country, '', 0);
      }
    }
    
    if (!searchResult || !searchResult.results) {
      console.log('No more results found after multiple attempts');
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
    
    // Only report hasMore if we actually found new results and haven't met our target count
    const reachedTargetCount = currentResults.length + newResults.length >= targetResultCount;
    const hasMore = searchResult.hasMore && (!reachedTargetCount);
    
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
