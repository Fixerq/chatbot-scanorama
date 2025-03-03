
import { useResultsCallback } from './useResultsCallback';
import { useResultsState } from './useResultsState';

// Re-export the internal hooks
export { useResultsCallback, useResultsState };

// Define and export a combined hook for search results management
export const useSearchResults = (onResults?: (results: any[]) => void) => {
  const { 
    results, 
    isSearching, 
    setIsSearching, 
    setResults 
  } = useResultsState();
  
  const { updateResults } = useResultsCallback(
    results,
    setResults,
    onResults
  );
  
  return {
    results,
    isSearching,
    setIsSearching,
    updateResults
  };
};
