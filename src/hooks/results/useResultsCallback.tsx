
import { useEffect } from 'react';
import { Result } from '@/components/ResultsTable';
import { SearchResults } from '@/types/search';

export const useResultsCallback = (
  results: SearchResults,
  onResults: (results: Result[]) => void
) => {
  // Ensure results are passed to the parent component whenever they change
  useEffect(() => {
    if (results.currentResults.length > 0 && onResults) {
      console.log('Auto-calling onResults with current results:', results.currentResults.length);
      onResults(results.currentResults);
    }
  }, [results.currentResults, onResults]);
};
