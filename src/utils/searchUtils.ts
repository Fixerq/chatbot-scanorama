
import { toast } from 'sonner';
import { Result } from '@/components/ResultsTable';
import { BLOCKED_URLS } from '@/constants/blockedUrls';
import { performGoogleSearch } from './searchEngine';
import { isExcludedDomain } from './helpers/domainFilters';

const isUrlBlocked = (url: string): boolean => {
  if (!url) return true;
  
  try {
    const urlObject = new URL(url);
    const hostname = urlObject.hostname.toLowerCase();
    
    // Block all Google domains
    if (hostname.includes('google.') || hostname === 'google.com') {
      console.log('Blocked Google domain:', url);
      return true;
    }
    
    // Check excluded domains
    if (isExcludedDomain(url)) {
      console.log('Blocked excluded domain:', url);
      return true;
    }
    
    // Check blocked URLs list
    if (BLOCKED_URLS.some(blockedUrl => url.toLowerCase().includes(blockedUrl.toLowerCase()))) {
      console.log('Blocked URL pattern:', url);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking URL:', url, error);
    return true;
  }
};

export const performSearch = async (
  query: string,
  country: string,
  region: string,
  apiKey: string,
  resultsLimit: number
): Promise<{ results: Result[]; hasMore: boolean } | null> => {
  try {
    const searchResult = await performGoogleSearch(
      query,
      country,
      region
    );

    if (!searchResult || !searchResult.results) {
      toast.warning('No results found. Try adjusting your search terms.');
      return null;
    }

    console.log('Raw search results:', searchResult.results.length);
    
    // Filter out blocked URLs and excluded domains
    const filteredResults = searchResult.results.filter(result => {
      const blocked = isUrlBlocked(result.url);
      if (blocked) {
        console.log('Filtered out URL:', result.url);
      }
      return !blocked;
    });

    console.log('Filtered results:', filteredResults.length);

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

    // Filter out blocked URLs and excluded domains
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
