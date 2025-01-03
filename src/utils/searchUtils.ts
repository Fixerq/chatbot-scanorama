import { toast } from 'sonner';
import { Result } from '@/components/ResultsTable';
import { FirecrawlService } from './FirecrawlService';

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
    const response = await FirecrawlService.searchWebsites(query, country, region, resultsLimit);

    if (!response.success) {
      toast.error(response.error || 'Failed to search websites');
      return null;
    }

    const results = response.urls!.map((url: string) => ({
      url,
      status: 'Processing...'
    }));

    toast.success(`Found ${results.length} websites to analyze`);
    return { results, hasMore: response.hasMore || false };
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
    const response = await FirecrawlService.searchWebsites(query, country, region, newLimit);
    
    if (response.success && response.urls) {
      const newResults = response.urls
        .map((url: string) => ({
          url,
          status: 'Processing...'
        }))
        .filter((newResult: Result) => 
          !currentResults.some(existingResult => existingResult.url === newResult.url)
        );
      
      if (newResults.length > 0) {
        toast.success(`Loaded ${newResults.length} new websites`);
      } else {
        toast.info('No new websites found');
      }
      
      return { 
        newResults, 
        hasMore: response.hasMore || false 
      };
    }
    return null;
  } catch (error) {
    console.error('Load more error:', error);
    toast.error('Failed to load more results');
    return null;
  }
};