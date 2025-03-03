
import { useCallback } from 'react';
import { Result } from '@/components/ResultsTable';
import { SearchResults } from '@/types/search';

export const useResultsCallback = (
  results: SearchResults,
  onResultsUpdate: (newResults: Result[], hasMore: boolean) => void
) => {
  // Create a callback that updates results and calls the parent callback if provided
  const updateResults = useCallback((newResults: Result[], hasMore: boolean) => {
    console.log('Results callback handling update:', { count: newResults.length, hasMore });
    onResultsUpdate(newResults, hasMore);
  }, [onResultsUpdate]);

  return { updateResults };
};
