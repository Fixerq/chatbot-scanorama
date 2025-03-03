
import { Result } from '@/components/ResultsTable';
import { useResultsState } from './useResultsState';
import { useResultsCallback } from './useResultsCallback';
import { SearchResults } from '@/types/search';

// Re-export the internal hooks
export { useResultsState, useResultsCallback };

// Define and export a combined hook for search results management
export const useSearchResults = (onResults?: (results: Result[]) => void) => {
  // Initialize the state hook
  const stateHook = useResultsState();
  
  const { results, isSearching, setIsSearching } = stateHook;
  
  // Initialize the callback hook with state from the state hook
  const { updateResults } = useResultsCallback(
    results,
    (newResults: Result[], hasMore: boolean) => {
      // Update our internal state
      stateHook.updateResults(newResults, hasMore);
      
      // Also call the parent callback if provided
      if (onResults) {
        onResults(newResults);
      }
    }
  );
  
  // Return a combined API
  return {
    results,
    isSearching,
    setIsSearching,
    updateResults
  };
};
