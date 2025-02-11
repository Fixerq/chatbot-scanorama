
import { toast } from 'sonner';
import { Result } from '@/components/ResultsTable';
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
    const searchResult = await performGoogleSearch(query, country, region);

    if (!searchResult || !searchResult.results) {
      toast.warning('No results found. Try adjusting your search terms.');
      return null;
    }

    // Filter out blocked URLs
    const filteredResults = searchResult.results.filter(result => !isUrlBlocked(result.url));

    if (filteredResults.length === 0) {
      toast.warning('No valid results found after filtering. Try adjusting your search terms.');
      return null;
    }

    const hasMore = filteredResults.length > resultsLimit;
    const limitedResults = filteredResults.slice(0, resultsLimit);

    toast.success(`Found ${limitedResults.length} results to analyze`);

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
    const searchResult = await performGoogleSearch(
      query,
      country,
      region
    );
    
    if (!searchResult || !searchResult.results) {
      return null;
    }

    // Filter out blocked URLs and URLs we already have
    const newResults = searchResult.results
      .filter(result => !isUrlBlocked(result.url))
      .filter(newResult => !currentResults.some(existing => existing.url === newResult.url));

    return { 
      newResults,
      hasMore: searchResult.hasMore
    };
  } catch (error) {
    console.error('Load more error:', error);
    toast.error('Failed to load more results');
    return null;
  }
};
