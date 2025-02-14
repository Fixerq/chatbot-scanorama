
import { useState, useCallback } from 'react';
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSearchOperations = (setResults: (results: Result[]) => void) => {
  const [isSearching, setIsSearching] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [currentResults, setCurrentResults] = useState<Result[]>([]);

  const handleSearch = useCallback(async (
    query: string,
    country: string,
    region: string,
    apiKey: string,
    resultsLimit: number
  ) => {
    try {
      setIsSearching(true);
      const { data, error } = await supabase.functions.invoke('search-places', {
        body: {
          action: 'search',
          params: {
            query,
            country,
            region,
            resultsLimit
          }
        }
      });

      if (error) {
        console.error('Search error:', error);
        toast.error('An error occurred during search');
        throw error;
      }

      if (data?.data?.results) {
        const typedResults = data.data.results as Result[];
        setCurrentResults(typedResults);
        setResults(typedResults);
        setNextPageToken(data.data.nextPageToken);
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('Search operation failed:', error);
      toast.error('Search failed. Please try again.');
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
    try {
      setIsSearching(true);

      const { data, error } = await supabase.functions.invoke('search-places', {
        body: {
          action: 'search',
          params: {
            query,
            country,
            region,
            nextPageToken,
            resultsLimit: limit
          }
        }
      });

      if (error) {
        console.error('Load more error:', error);
        toast.error('Failed to load more results');
        return;
      }

      if (data?.data?.results) {
        const newResults = data.data.results as Result[];
        const combinedResults = [...currentResults, ...newResults];
        setCurrentResults(combinedResults);
        setResults(combinedResults);
        setNextPageToken(data.data.nextPageToken);
      }
    } catch (error) {
      console.error('Load more operation failed:', error);
      toast.error('Failed to load additional results');
    } finally {
      setIsSearching(false);
    }
  }, [nextPageToken, setResults, currentResults]);

  return {
    isSearching,
    handleSearch,
    handleLoadMore,
    nextPageToken
  };
};
