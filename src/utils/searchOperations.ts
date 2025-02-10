import { Result } from '@/components/ResultsTable';
import { performGoogleSearch } from './searchEngine';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const executeSearch = async (
  query: string,
  country: string,
  region: string,
  apiKey: string,
  resultsLimit: number,
  currentResults: Result[]
): Promise<{ newResults: Result[]; hasMore: boolean } | null> => {
  const { data: { session } } = await supabase.auth.getSession();
    
  if (!session) {
    console.log('No session found, redirecting to login');
    window.location.href = '/login';
    return null;
  }

  console.log('Starting search with params:', {
    query,
    country,
    region,
    limit: 'unlimited'
  });

  try {
    const searchResult = await performGoogleSearch(
      query,
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
    throw error;
  }
};

export const loadMore = async (
  query: string,
  country: string,
  region: string,
  currentResults: Result[],
  newLimit: number
): Promise<{ newResults: Result[]; hasMore: boolean } | null> => {
  const { data: { session } } = await supabase.auth.getSession();
    
  if (!session) {
    console.log('No session found, redirecting to login');
    window.location.href = '/login';
    return null;
  }

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
    throw error;
  }
};
