
import { useState, useCallback } from 'react';
import { Result } from '@/components/ResultsTable';
import { loadMore } from '@/utils/search/operations';

export const usePagination = (
  results: Result[],
  updateResults: (newResults: Result[], hasMore: boolean) => void,
  setIsSearching: (isSearching: boolean) => void
) => {
  const [loadingPages, setLoadingPages] = useState<number[]>([]);
  
  const handleLoadMore = useCallback(async (
    pageNumber: number, 
    forcePagination = false,
    searchParams?: { query: string; country: string; region: string }
  ) => {
    // If we don't have search params, we can't load more
    if (!searchParams || !searchParams.query || !searchParams.country) {
      console.error('Missing search parameters for pagination');
      return;
    }
    
    // Mark this page as loading
    setLoadingPages(prev => [...prev, pageNumber]);
    setIsSearching(true);
    
    try {
      console.log(`Loading page ${pageNumber} for query: ${searchParams.query}`);
      
      const { query, country, region } = searchParams;
      
      // Load more results using the token-based pagination
      const paginationResult = await loadMore(
        query,
        country,
        region || '',
        results,
        results.length + 10 // Target getting 10 more results
      );
      
      if (paginationResult) {
        const { newResults, hasMore } = paginationResult;
        
        console.log(`Received ${newResults.length} new results, hasMore: ${hasMore}`);
        
        // Merge the new results with existing ones
        const combinedResults = [...results, ...newResults];
        
        // Update the results
        updateResults(combinedResults, hasMore);
      }
    } catch (error) {
      console.error('Error during pagination:', error);
    } finally {
      // Remove this page from loading pages
      setLoadingPages(prev => prev.filter(p => p !== pageNumber));
      setIsSearching(false);
    }
  }, [results, updateResults, setIsSearching]);
  
  return {
    loadingPages,
    handleLoadMore
  };
};
