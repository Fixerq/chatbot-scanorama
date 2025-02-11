
import { Result } from '@/components/ResultsTable';
import { performGoogleSearch } from './searchEngine';
import { supabase } from '@/integrations/supabase/client';

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
    window.location.href = '/login';
    return null;
  }

  console.log('Starting search');

  try {
    const searchResult = await performGoogleSearch(
      query,
      country,
      region
    );

    if (!searchResult || !searchResult.results) {
      return null;
    }

    const existingUrls = new Set(currentResults.map(r => r.url));
    const newResults = searchResult.results
      .filter(result => !existingUrls.has(result.url))
      .map(result => ({
        url: result.url,
        details: {
          title: result.title,
          description: result.description,
          lastChecked: new Date().toISOString()
        }
      }));

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
    window.location.href = '/login';
    return null;
  }

  try {
    const searchResult = await performGoogleSearch(
      query,
      country,
      region
    );
    
    if (!searchResult || !searchResult.results) {
      return null;
    }

    const existingUrls = new Set(currentResults.map(r => r.url));
    const newResults = searchResult.results
      .filter(result => !existingUrls.has(result.url))
      .map(result => ({
        url: result.url,
        details: {
          title: result.title,
          description: result.description,
          lastChecked: new Date().toISOString()
        }
      }));

    return {
      newResults,
      hasMore: searchResult.hasMore
    };
  } catch (error) {
    console.error('Load more error:', error);
    throw error;
  }
};
