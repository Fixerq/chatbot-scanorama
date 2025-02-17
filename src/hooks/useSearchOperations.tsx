
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SearchResult, Status } from '@/utils/types/search';

// Simplified analysis job interface
interface AnalysisJob {
  url: string;
  status: Status;
  error?: string;
  result?: {
    has_chatbot: boolean;
    chatSolutions: string[];
    status: Status;
    error?: string;
  };
  metadata?: Record<string, unknown>;
  batch_id: string;
}

export const useSearchOperations = (setResults: (results: SearchResult[]) => void) => {
  const [isSearching, setIsSearching] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const handleSearch = useCallback(async (
    query: string,
    country: string,
    region: string,
    apiKey: string,
    limit: number
  ) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-places', {
        body: { query, country, region, apiKey, limit }
      });

      if (error) throw error;

      if (data?.results) {
        setResults(data.results);
        setNextPageToken(data.nextPageToken || null);
      }
    } catch (error) {
      console.error('Search error:', error);
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
    if (!nextPageToken) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-places', {
        body: { 
          query, 
          country, 
          region, 
          pageToken: nextPageToken,
          page,
          limit
        }
      });

      if (error) throw error;

      if (data?.results) {
        setResults((current: SearchResult[]) => {
          return [...current, ...data.results];
        });
        setNextPageToken(data.nextPageToken || null);
      }
    } catch (error) {
      console.error('Load more error:', error);
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
