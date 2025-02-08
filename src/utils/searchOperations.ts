
import { Result } from '@/components/ResultsTable';
import { performGoogleSearch } from './searchEngine';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const enhanceSearchQuery = async (
  query: string,
  country: string,
  region: string
): Promise<string> => {
  try {
    console.log('Calling enhance-search with:', { query, country, region });
    
    const { data, error } = await supabase.functions.invoke('enhance-search', {
      body: { query, country, region },
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (error) {
      console.error('Error enhancing search query:', error);
      toast.error('Failed to enhance search query, using original query');
      return query;
    }

    if (!data?.enhancedQuery) {
      console.log('No enhanced query returned, using original');
      return query;
    }

    console.log('Original query:', query);
    console.log('Enhanced query:', data.enhancedQuery);
    
    if (data.enhancedQuery.length < 3) {
      console.log('Enhanced query too short, using original');
      return query;
    }

    return data.enhancedQuery;
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
    limit: 'unlimited'
  });

  try {
    const searchResult = await performGoogleSearch(
      enhancedQuery,
      country,
      region
    );

    if (!searchResult || !searchResult.results) {
      console.error('No search results returned');
      return null;
    }

    // Filter out duplicates while keeping existing results
    const existingUrls = new Set(currentResults.map(r => r.url));
    const newResults = searchResult.results.filter(result => !existingUrls.has(result.url));

    console.log(`Found ${newResults.length} new results`);

    return {
      newResults,
      hasMore: searchResult.hasMore
    };
  } catch (error) {
    console.error('Search error:', error);
    throw error; // Let the calling component handle the error
  }
};

export const loadMore = async (
  query: string,
  country: string,
  region: string,
  currentResults: Result[],
  newLimit: number // This parameter is kept for backward compatibility but not used
): Promise<{ newResults: Result[]; hasMore: boolean } | null> => {
  try {
    const startIndex = currentResults.length + 1;
    const searchResult = await performGoogleSearch(query, country, region, startIndex);
    
    if (!searchResult || !searchResult.results) {
      return null;
    }

    // Filter out duplicates
    const existingUrls = new Set(currentResults.map(r => r.url));
    const newResults = searchResult.results.filter(result => !existingUrls.has(result.url));

    return {
      newResults,
      hasMore: searchResult.hasMore
    };
  } catch (error) {
    console.error('Load more error:', error);
    throw error; // Let the calling component handle the error
  }
};
