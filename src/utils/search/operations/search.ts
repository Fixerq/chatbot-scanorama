import { Result } from '@/components/ResultsTable';
import { performGoogleSearch } from '../index';
import { toast } from 'sonner';
import { enhanceSearchQuery } from './enhancer';
import { validateSearchParams } from './validator';

/**
 * Executes a search with all the necessary parameters
 */
export const executeSearch = async (
  query: string,
  country: string,
  region: string,
  apiKey: string,
  resultsLimit: number,
  currentResults: Result[]
): Promise<{ newResults: Result[]; hasMore: boolean } | null> => {
  try {
    // Validate search parameters
    if (!validateSearchParams(query, country)) {
      return { newResults: [], hasMore: false };
    }

    const enhancedQuery = await enhanceSearchQuery(query, country, region);

    // Add more specific terms to the query to find businesses more likely to have chatbots
    // but don't overdo it to ensure we get good location-specific results
    const chatbotTerms = "website customer service";
    const finalQuery = `${enhancedQuery} ${chatbotTerms}`;

    console.log('Starting search with params:', {
      originalQuery: query,
      enhancedQuery,
      finalQuery,
      country,
      region,
      limit: resultsLimit
    });

    // Pass both country and region parameters for more accurate location filtering
    const searchResult = await performGoogleSearch(
      finalQuery,
      country,
      region
    );

    if (!searchResult) {
      console.error('No search results returned');
      return { newResults: [], hasMore: false };
    }

    console.log('Search results received:', searchResult.results?.length || 0);

    // Check if we have any results
    if (!searchResult.results || searchResult.results.length === 0) {
      console.log('Search returned empty results array');
      
      // Try a more generic search as fallback
      console.log('Attempting fallback search with just the original query...');
      
      // Try a series of increasingly simpler searches
      const fallbackQueries = [
        query, // Original query
        `${query} in ${region || ''} ${country}`.trim(), // Structured query with location
        `${query} services in ${country}`, // Add services
        `${query} business in ${country}`, // Try with business term
        region ? `${query} in ${region}` : null, // Just region if available
        query.split(' ')[0] + ` in ${country}` // Just first word with country
      ].filter(Boolean); // Remove any null entries
      
      for (const fallbackQuery of fallbackQueries) {
        console.log(`Trying fallback search with: "${fallbackQuery}"`);
        
        // Show a toast to inform the user about the retry
        if (fallbackQuery === fallbackQueries[0]) {
          toast.info('No results found with initial search. Trying alternative search terms...');
        }
        
        const fallbackResult = await performGoogleSearch(fallbackQuery, country, region);
        
        if (fallbackResult?.results && fallbackResult.results.length > 0) {
          console.log(`Fallback search found ${fallbackResult.results.length} results`);
          
          // Filter out duplicates while keeping existing results
          const existingUrls = new Set(currentResults.map(r => r.url.toLowerCase()));
          const newResults = fallbackResult.results.filter(result => {
            const lowerUrl = result.url.toLowerCase();
            return !existingUrls.has(lowerUrl);
          });
          
          console.log(`Found ${newResults.length} new results after filtering duplicates`);
          
          if (newResults.length > 0) {
            toast.success(`Found ${newResults.length} results with modified search criteria`);
            return {
              newResults,
              hasMore: fallbackResult.hasMore && newResults.length > 0
            };
          }
        }
      }
      
      // If all fallbacks failed, return empty results
      toast.error('No results found. Please try different search terms or locations.');
      return { newResults: [], hasMore: false };
    }

    // Process "No website" placeholders
    const processedResults = searchResult.results.map(result => {
      if (result.url === 'https://example.com/no-website') {
        // For business listings without websites, create a modified entry
        // that still shows up but is clearly marked
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

    // Filter out duplicates while keeping existing results
    const existingUrls = new Set(currentResults.map(r => r.url.toLowerCase()));
    const newResults = processedResults.filter(result => {
      const lowerUrl = result.url.toLowerCase();
      return !existingUrls.has(lowerUrl) && lowerUrl !== 'https://example.com/no-website';
    });

    console.log(`Found ${newResults.length} new results after filtering duplicates`);

    if (newResults.length === 0) {
      toast.info('No new results found. Try different search terms or locations.');
    } else {
      toast.success(`Found ${newResults.length} new results to analyze`);
    }

    return {
      newResults,
      hasMore: searchResult.hasMore && newResults.length > 0
    };
  } catch (error) {
    console.error('Search execution error:', error);
    toast.error('Failed to perform search. Please try again with different terms.');
    return { newResults: [], hasMore: false };
  }
};
