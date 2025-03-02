
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
  
  const updateResults = (newResults: Result[], hasMoreResults: boolean) => {
    console.log('Updating results:', { count: newResults.length, hasMore: hasMoreResults });
    
    setResults({
      currentResults: newResults,
      hasMore: hasMoreResults
    });
    setHasMore(hasMoreResults);
    
    if (onResults) {
      onResults(newResults);
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
