
import { useResultsState } from './useResultsState';
import { useResultsCallback } from './useResultsCallback';
import { Result } from '@/components/ResultsTable';

export const useSearchResults = (onResults: (results: Result[]) => void) => {
  const {
    results,
    isSearching,
    setIsSearching,
    updateResults
  } = useResultsState(onResults);
  
  // Set up the callback effect
  useResultsCallback(results, onResults);

  return {
    results,
    isSearching,
    setIsSearching,
    updateResults
  };
};

export * from './useResultsState';
export * from './useResultsCallback';
