import { toast } from 'sonner';
import { Result } from '@/components/ResultsTable';
import { FirecrawlService } from './FirecrawlService';
import { supabase } from '@/integrations/supabase/client';

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

    const response = await FirecrawlService.searchWebsites(query, country, region, resultsLimit);

    if (!response.success) {
      toast.error(response.error || 'Failed to search websites');
      return null;
    }

    // Create a map of existing results for quick lookup
    const existingResultsMap = new Map(
      existingResults?.map(result => [result.url, result]) || []
    );

    // Combine existing and new URLs
    const allResults: Result[] = response.urls!.map(url => ({
      url,
      status: existingResultsMap.get(url)?.status || 'Processing...'
    }));

    toast.success(`Found ${allResults.length} websites to analyze`);
    return { 
      results: allResults.slice(0, resultsLimit), 
      hasMore: response.hasMore || false 
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

    const response = await FirecrawlService.searchWebsites(query, country, region, newLimit);
    
    if (response.success && response.urls) {
      const existingResultsMap = new Map(
        existingResults?.map(result => [result.url, result]) || []
      );
      const currentUrlsSet = new Set(currentResults.map(r => r.url));

      // Create new results array, prioritizing existing analysis results
      const newResults = response.urls
        .filter(url => !currentUrlsSet.has(url))
        .map(url => ({
          url,
          status: existingResultsMap.get(url)?.status || 'Processing...'
        }));
      
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