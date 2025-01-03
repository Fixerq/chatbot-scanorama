import { toast } from 'sonner';
import { Result } from '@/components/ResultsTable';
import { FirecrawlService } from './firecrawl';
import { supabase } from '@/integrations/supabase/client';
import { BLOCKED_URLS } from '@/constants/blockedUrls';

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
  if (!apiKey) {
    toast.error('Please enter your Firecrawl API key');
    return null;
  }

  FirecrawlService.saveApiKey(apiKey);

  try {
    // Get existing analyzed URLs for this search
    const { data: existingResults } = await supabase
      .from('analyzed_urls')
      .select('url, status');

    const response = await FirecrawlService.searchWebsites(query, country, region, resultsLimit + 5);

    if (!response.success) {
      toast.error(response.error || 'Failed to search websites');
      return null;
    }

    // Create a map of existing results for quick lookup
    const existingResultsMap = new Map(
      existingResults?.map(result => [result.url, result]) || []
    );

    // Filter out blocked URLs and combine existing and new URLs
    const allResults: Result[] = response.urls!
      .filter(url => !isUrlBlocked(url))
      .map(url => ({
        url,
        status: existingResultsMap.get(url)?.status || 'Processing...'
      }));

    const hasMore = allResults.length > resultsLimit;
    const limitedResults = allResults.slice(0, resultsLimit);

    toast.success(`Found ${limitedResults.length} websites to analyze`);
    return { 
      results: limitedResults,
      hasMore: hasMore
    };
  } catch (error) {
    console.error('Search error:', error);
    toast.error('Failed to search websites. Please check your API key and try again.');
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
    // Get existing analyzed URLs
    const { data: existingResults } = await supabase
      .from('analyzed_urls')
      .select('url, status');

    const response = await FirecrawlService.searchWebsites(query, country, region, newLimit + 5);
    
    if (response.success && response.urls) {
      const existingResultsMap = new Map(
        existingResults?.map(result => [result.url, result]) || []
      );
      const currentUrlsSet = new Set(currentResults.map(r => r.url));

      // Filter out blocked URLs and URLs we already have, then create new results array
      const newResults = response.urls
        .filter(url => !isUrlBlocked(url) && !currentUrlsSet.has(url))
        .map(url => ({
          url,
          status: existingResultsMap.get(url)?.status || 'Processing...'
        }));

      const hasMore = response.urls.length > newLimit;
      const limitedNewResults = newResults.slice(0, newLimit - currentResults.length);
      
      if (limitedNewResults.length > 0) {
        toast.success(`Loaded ${limitedNewResults.length} new websites`);
      } else {
        toast.info('No new websites found');
      }
      
      return { 
        newResults: limitedNewResults,
        hasMore: hasMore
      };
    }
    return null;
  } catch (error) {
    console.error('Load more error:', error);
    toast.error('Failed to load more results');
    return null;
  }
};