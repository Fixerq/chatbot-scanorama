
import { useState, useCallback } from 'react';
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBatchAnalysis } from './useBatchAnalysis';
import { SearchResult, SearchResponse } from '@/types/search';

export const useSearchOperations = (setResults: (results: Result[]) => void) => {
  const [isSearching, setIsSearching] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [currentResults, setCurrentResults] = useState<Result[]>([]);
  const { analyzeBatch, isProcessing: isAnalyzing, progress } = useBatchAnalysis();

  const handleSearch = useCallback(async (
    query: string,
    country: string,
    region: string,
    apiKey: string,
    resultsLimit: number
  ) => {
    try {
      setIsSearching(true);
      const { data, error } = await supabase.functions.invoke<SearchResponse>('search-places', {
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
        // Convert search results to Result type
        const searchResults = data.data.results.map((result: SearchResult) => ({
          url: result.url,
          title: result.title,
          description: result.description,
          details: {
            ...result.details,
            search_batch_id: data.data.searchBatchId
          }
        }));

        setCurrentResults(searchResults);
        setResults(searchResults);
        setNextPageToken(data.data.hasMore ? data.data.searchBatchId : undefined);
        
        // Start batch analysis if there are URLs
        const websiteUrls = searchResults
          .map(result => result.url)
          .filter(url => url && !url.includes('google.com/maps'));

        if (websiteUrls.length > 0) {
          await analyzeBatch(websiteUrls);
        }

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
  }, [setResults, analyzeBatch]);

  const handleLoadMore = useCallback(async (
    query: string,
    country: string,
    region: string,
    page: number,
    limit: number
  ) => {
    try {
      setIsSearching(true);

      const { data, error } = await supabase.functions.invoke<SearchResponse>('search-places', {
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
        const newResults = data.data.results.map((result: SearchResult) => ({
          url: result.url,
          title: result.title,
          description: result.description,
          details: {
            ...result.details,
            search_batch_id: data.data.searchBatchId
          }
        }));
        
        // Filter out duplicates based on URL
        const existingUrls = new Set(currentResults.map(r => r.url));
        const uniqueNewResults = newResults.filter(result => !existingUrls.has(result.url));
        
        const combinedResults = [...currentResults, ...uniqueNewResults];
        setCurrentResults(combinedResults);
        setResults(combinedResults);
        setNextPageToken(data.data.hasMore ? data.data.searchBatchId : undefined);

        // Start batch analysis for new URLs
        const newWebsiteUrls = uniqueNewResults
          .map(result => result.url)
          .filter(url => url && !url.includes('google.com/maps'));

        if (newWebsiteUrls.length > 0) {
          await analyzeBatch(newWebsiteUrls);
        }
      }
    } catch (error) {
      console.error('Load more operation failed:', error);
      toast.error('Failed to load additional results');
    } finally {
      setIsSearching(false);
    }
  }, [nextPageToken, setResults, currentResults, analyzeBatch]);

  return {
    isSearching,
    isAnalyzing,
    progress,
    handleSearch,
    handleLoadMore,
    nextPageToken
  };
};
