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
      .select('url, status')
      .ilike('url', `%${query}%`)
      .limit(resultsLimit);

    const response = await FirecrawlService.searchWebsites(query, country, region, resultsLimit);

    if (!response.success) {
      toast.error(response.error || 'Failed to search websites');
      return null;
    }

    // Combine existing and new URLs
    const existingUrls = new Set(existingResults?.map(r => r.url) || []);
    const allUrls = [...(existingResults || []), ...response.urls!.map(url => ({ url, status: 'Processing...' }))];
    
    // Remove duplicates while preserving order
    const uniqueResults = Array.from(new Map(allUrls.map(item => [item.url, item])).values());

    toast.success(`Found ${uniqueResults.length} websites to analyze`);
    return { 
      results: uniqueResults.slice(0, resultsLimit), 
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
    const response = await FirecrawlService.searchWebsites(query, country, region, newLimit);
    
    if (response.success && response.urls) {
      // Get existing analyzed URLs
      const { data: existingResults } = await supabase
        .from('analyzed_urls')
        .select('url, status')
        .in('url', response.urls);

      const existingUrlsMap = new Map(existingResults?.map(r => [r.url, r.status]) || []);
      const currentUrlsSet = new Set(currentResults.map(r => r.url));

      // Create new results array, prioritizing existing analysis results
      const newResults = response.urls
        .filter(url => !currentUrlsSet.has(url))
        .map(url => ({
          url,
          status: existingUrlsMap.get(url) || 'Processing...'
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