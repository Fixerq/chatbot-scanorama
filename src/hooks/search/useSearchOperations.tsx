
import { Result } from '@/components/ResultsTable';
import { useState } from 'react';
import { useSearchValidation } from '../useSearchValidation';
import { useSearchExecution } from './useSearchExecution';
import { usePagination, SearchParams } from './usePagination';
import { useSearchParams } from './useSearchParams';

export const useSearchOperations = (onResults: (results: Result[], hasMore: boolean) => void) => {
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
      // Always send all results regardless of update type - critical fix here!
      if (isPartialUpdate) {
        setResults(prev => {
          // Get all unique results
          const allResults = [...prev.currentResults];
          
          // Merge new results
          newResults.forEach(newResult => {
            const existingIndex = allResults.findIndex(r => r.url === newResult.url);
            if (existingIndex >= 0) {
              allResults[existingIndex] = newResult;
            } else {
              allResults.push(newResult);
            }
          });
          
          // Call onResults with all results and hasMore status
          onResults(allResults, hasMoreResults || prev.hasMore);
          
          return {
            currentResults: allResults,
            hasMore: hasMoreResults || prev.hasMore
          };
        });
      } else {
        // For complete replacements, send everything
        onResults(newResults, hasMoreResults);
      }
    }
  };
  
  const { isSearching, setIsSearching, executeSearchOperation } = useSearchExecution(updateResults);
  const { lastSearchParams, updateSearchParams } = useSearchParams();
  const { loadingPages, handleLoadMore: paginationLoadMore } = usePagination(
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

  // Modify the handleLoadMore function to match the expected signature
  const handleLoadMore = (pageNumber?: number, forcePagination = false) => 
    paginationLoadMore(pageNumber || 1, forcePagination, lastSearchParams);

  return {
    results: { 
      currentResults: results.currentResults, 
      hasMore: results.hasMore || hasMore 
    },
    isSearching,
    handleSearch,
    handleLoadMore,
    loadingPages
  };
};
