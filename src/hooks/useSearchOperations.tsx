
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SearchResult } from '@/utils/types/search';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';
import { transformSearchResult } from './useTransformResults';
import { useAnalysisSubscription } from './useAnalysisSubscription';

interface SearchResponse {
  results: SearchResult[];
  nextPageToken?: string;
  searchBatchId?: string;
  error?: string;
  details?: string;
}

export const useSearchOperations = (setResults: React.Dispatch<React.SetStateAction<Result[]>>) => {
  const [isSearching, setIsSearching] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  // Set up analysis subscription
  useAnalysisSubscription(setResults);

  const handleSearch = useCallback(async (
    query: string,
    country: string,
    region: string,
    apiKey: string,
    limit: number
  ) => {
    console.log('Starting search with params:', { query, country, region, limit });
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke<SearchResponse>('search-places', {
        body: { 
          query: query.trim(), 
          country: country.trim(), 
          region: region.trim(), 
          limit 
        }
      });

      console.log('Search response:', data);

      if (error) {
        console.error('Supabase function error:', error);
        toast.error('Search failed: ' + error.message);
        throw error;
      }

      if (data?.error) {
        console.error('Search error:', data.error, data.details);
        toast.error(data.error);
        throw new Error(data.error);
      }

      if (!data?.results) {
        console.error('No results returned from search');
        toast.error('No results found');
        setResults([]);
        return;
      }

      console.log('Search successful:', data.results.length, 'results found');
      
      const transformedResults = data.results.map(transformSearchResult);
      console.log('Transformed results:', transformedResults);
      
      setResults(transformedResults);
      setNextPageToken(data.nextPageToken || null);
      
      if (data.results.length === 0) {
        toast.info('No results found for your search');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('An error occurred during search');
      setResults([]);
      throw error;
    } finally {
      setIsSearching(false);
    }
  }, [setResults]);

  const handleLoadMore = useCallback(async (
    query: string,
    country: string,
    region: string,
    page: number,
    limit: number
  ) => {
    if (!nextPageToken) {
      console.log('No next page token available');
      return;
    }

    console.log('Loading more results with params:', { query, country, region, page, limit });
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke<SearchResponse>('search-places', {
        body: { 
          query: query.trim(), 
          country: country.trim(), 
          region: region.trim(), 
          pageToken: nextPageToken,
          page,
          limit
        }
      });

      console.log('Load more response:', data);

      if (error) {
        console.error('Load more error:', error);
        toast.error('Failed to load more results: ' + error.message);
        throw error;
      }

      if (data?.error) {
        console.error('Load more error:', data.error, data.details);
        toast.error(data.error);
        throw new Error(data.error);
      }

      if (data?.results) {
        console.log('Load more successful:', data.results.length, 'additional results');
        const transformedResults = data.results.map(transformSearchResult);
        console.log('Transformed additional results:', transformedResults);
        
        setResults(prevResults => [...prevResults, ...transformedResults]);
        setNextPageToken(data.nextPageToken || null);
      }
    } catch (error) {
      console.error('Load more error:', error);
      toast.error('Failed to load more results');
      throw error;
    } finally {
      setIsSearching(false);
    }
  }, [nextPageToken, setResults]);

  return {
    isSearching,
    handleSearch,
    handleLoadMore,
    nextPageToken
  };
};
