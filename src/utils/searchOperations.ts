import { Result } from '@/components/ResultsTable';
import { performSearch, loadMoreResults } from './searchUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const enhanceSearchQuery = async (
  query: string,
  country: string,
  region: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('enhance-search', {
      body: { query, country, region }
    });

    if (error) {
      console.error('Error enhancing search query:', error);
      toast.error('Failed to enhance search query, using original query');
      return query;
    }

    console.log('Enhanced query:', data.enhancedQuery);
    return data.enhancedQuery || query;
  } catch (error) {
    console.error('Error calling enhance-search function:', error);
    toast.error('Failed to enhance search query, using original query');
    return query;
  }
};

export const executeSearch = async (
  query: string,
  country: string,
  region: string,
  apiKey: string,
  resultsLimit: number,
  currentResults: Result[]
): Promise<{ newResults: Result[]; hasMore: boolean } | null> => {
  const enhancedQuery = await enhanceSearchQuery(query, country, region);

  console.log('Starting search with params:', {
    originalQuery: query,
    enhancedQuery,
    country,
    region,
    limit: resultsLimit
  });

  const searchResult = await performSearch(
    enhancedQuery,
    country,
    region,
    apiKey,
    resultsLimit
  );

  if (!searchResult) return null;

  // Filter out duplicates while keeping existing results
  const existingUrls = new Set(currentResults.map(r => r.url));
  const newResults = searchResult.results.filter(result => !existingUrls.has(result.url));

  console.log(`Found ${newResults.length} new results`);

  return {
    newResults,
    hasMore: searchResult.hasMore
  };
};

export const loadMore = async (
  query: string,
  country: string,
  region: string,
  currentResults: Result[],
  newLimit: number
) => {
  return loadMoreResults(
    query,
    country,
    region,
    currentResults,
    newLimit
  );
};
