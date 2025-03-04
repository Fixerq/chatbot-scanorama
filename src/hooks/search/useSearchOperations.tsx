
import { Result } from '@/components/ResultsTable';
import { useState } from 'react';
import { useSearchValidation } from '../useSearchValidation';
import { useSearchExecution } from './useSearchExecution';
import { usePagination } from './usePagination';
import { useSearchParams } from './useSearchParams';

export const useSearchOperations = (onResults: (results: Result[]) => void) => {
  const [results, setResults] = useState<{ currentResults: Result[], hasMore: boolean }>({
    currentResults: [],
    hasMore: false
  });
  const [hasMore, setHasMore] = useState(false);
  
  const { validateSearchParams } = useSearchValidation();
  
  // This function will now update results incrementally as they come in
  const updateResults = (newResults: Result[], hasMoreResults: boolean, isPartialUpdate = false) => {
    console.log('Updating results:', { 
      count: newResults.length, 
      hasMore: hasMoreResults,
      isPartialUpdate
    });
    
    if (isPartialUpdate) {
      // For partial updates, add to existing results
      setResults(prev => {
        // Create a map of existing results by URL
        const urlMap = new Map(prev.currentResults.map(r => [r.url, r]));
        
        // Add or update with new results
        newResults.forEach(result => {
          urlMap.set(result.url, result);
        });
        
        // Convert map back to array
        const updatedResults = Array.from(urlMap.values());
        
        return {
          currentResults: updatedResults,
          hasMore: hasMoreResults || prev.hasMore
        };
      });
    } else {
      // For complete replacements
      setResults({
        currentResults: newResults,
        hasMore: hasMoreResults
      });
    }
    
    setHasMore(hasMoreResults);
    
    // Notify the parent component of all results so far
    if (onResults) {
      if (isPartialUpdate) {
        // For partial updates, we only send the new batch
        onResults(newResults);
      } else {
        // For complete replacements, send everything
        onResults(newResults);
      }
    }
  };
  
  const { isSearching, setIsSearching, executeSearchOperation } = useSearchExecution(updateResults);
  const { lastSearchParams, updateSearchParams } = useSearchParams();
  const { loadingPages, handleLoadMore } = usePagination(
    results.currentResults, 
    updateResults, 
    setIsSearching
  );

  const handleSearch = async (
    query: string,
    country: string,
    region: string,
    apiKey: string,
    resultsLimit: number
  ) => {
    if (!validateSearchParams(query, country)) return;

    setIsSearching(true);
    
    // Save the search parameters for later use in pagination
    updateSearchParams({
      query,
      country,
      region,
      apiKey,
      resultsLimit
    });
    
    await executeSearchOperation(query, country, region, apiKey, resultsLimit);
  };

  return {
    results: { 
      currentResults: results.currentResults, 
      hasMore: results.hasMore || hasMore 
    },
    isSearching,
    handleSearch,
    handleLoadMore: (pageNumber?: number, forcePagination = false) => 
      handleLoadMore(pageNumber || 1, forcePagination, lastSearchParams),
    loadingPages
  };
};

export default useSearchOperations;
