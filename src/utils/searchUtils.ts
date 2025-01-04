import { toast } from 'sonner';
import { Result } from '@/components/ResultsTable';
import { FirecrawlService } from './firecrawl';
import { supabase } from '@/integrations/supabase/client';
import { BLOCKED_URLS } from '@/constants/blockedUrls';
import { performGoogleSearch } from './searchEngine';

const isUrlBlocked = (url: string): boolean => {
  return BLOCKED_URLS.some(blockedUrl => url.toLowerCase().includes(blockedUrl.toLowerCase()));
};

export const performSearch = async (
  query: string,
  country: string,
  region: string,
  apiKey: string,
  resultsLimit: number
): Promise<{ results: Result[]; hasMore: boolean } | null> => {
  try {
    // Get existing analyzed URLs for this search
    const { data: existingResults } = await supabase
      .from('analyzed_urls')
      .select('url, status');

    const searchResult = await performGoogleSearch(query, country, region);

    // Create a map of existing results for quick lookup
    const existingResultsMap = new Map(
      existingResults?.map(result => [result.url, result]) || []
    );

    // Filter out blocked URLs and combine with existing URLs
    const allResults: Result[] = searchResult.results
      .filter(result => !isUrlBlocked(result.url))
      .map(result => ({
        ...result,
        status: existingResultsMap.get(result.url)?.status || 'Processing...'
      }));

    const hasMore = allResults.length > resultsLimit;
    const limitedResults = allResults.slice(0, resultsLimit);

    if (limitedResults.length === 0) {
      toast.warning('No results found. Try adjusting your search terms.');
    } else {
      toast.success(`Found ${limitedResults.length} results to analyze`);
    }

    return { 
      results: limitedResults,
      hasMore: hasMore
    };
  } catch (error) {
    console.error('Search error:', error);
    toast.error('Failed to search. Please try again.');
    return null;
  }
};

export const loadMoreResults = async (
  query: string,
  country: string,
  region: string,
  currentResults: Result[],
  newLimit: number
): Promise<{ newResults: Result[]; hasMore: boolean } | null> => {
  try {
    // Calculate the start index for the next page (Google uses 1-based indexing)
    const startIndex = currentResults.length + 1;
    
    const searchResult = await performGoogleSearch(
      query,
      country,
      region,
      startIndex
    );
    
    if (searchResult.results.length > 0) {
      // Filter out blocked URLs and URLs we already have
      const newResults = searchResult.results
        .filter(result => !isUrlBlocked(result.url))
        .filter(newResult => !currentResults.some(existing => existing.url === newResult.url));

      return { 
        newResults,
        hasMore: searchResult.hasMore
      };
    }
    return null;
  } catch (error) {
    console.error('Load more error:', error);
    toast.error('Failed to load more results');
    return null;
  }
};