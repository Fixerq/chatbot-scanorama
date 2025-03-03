
import { toast } from 'sonner';
import { Result } from '@/components/ResultsTable';
import { BLOCKED_URLS } from '@/constants/blockedUrls';
import { performPlacesSearch } from './searchEngine';

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
    const searchResponse = await performPlacesSearch({
      query,
      country,
      region,
      limit: resultsLimit
    });

    if (!searchResponse || !searchResponse.results) {
      toast.warning('No results found. Try adjusting your search terms.');
      return null;
    }

    // Filter out blocked URLs
    const filteredResults = searchResponse.results.filter(result => !isUrlBlocked(result.url));

    if (filteredResults.length === 0) {
      toast.warning('No valid results found after filtering. Try adjusting your search terms.');
      return null;
    }

    const hasMore = searchResponse.hasMore;

    toast.success(`Found ${filteredResults.length} results to analyze`);

    return { 
      results: filteredResults,
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
  currentResults: Result[]
): Promise<{ newResults: Result[]; hasMore: boolean } | null> => {
  try {
    // Load more results using the Places API pagination
    const moreResults = await performPlacesSearch({
      query,
      country,
      region,
      pageToken: currentResults[currentResults.length - 1]?._metadata?.nextPageToken,
      existingPlaceIds: currentResults.filter(r => r.id).map(r => r.id as string)
    });
    
    if (!moreResults || !moreResults.results) {
      return null;
    }

    // Filter out blocked URLs and URLs we already have
    const newResults = moreResults.results
      .filter(result => !isUrlBlocked(result.url))
      .filter(newResult => !currentResults.some(existing => existing.url === newResult.url));

    return { 
      newResults,
      hasMore: moreResults.hasMore
    };
  } catch (error) {
    console.error('Load more error:', error);
    toast.error('Failed to load more results');
    return null;
  }
};
