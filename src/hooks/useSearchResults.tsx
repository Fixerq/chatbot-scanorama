
import { useState, useEffect } from 'react';
import { Result } from '@/components/ResultsTable';
import { SearchResults } from '@/types/search';

export const useSearchResults = (onResults: (results: Result[]) => void) => {
  const [results, setResults] = useState<SearchResults>({
    currentResults: [],
    hasMore: false,
  });
  const [isSearching, setIsSearching] = useState(false);

  const updateResults = (newResults: Result[], hasMore: boolean) => {
    console.log('Updating results:', { count: newResults.length, hasMore });
    const updatedResults = {
      currentResults: newResults,
      hasMore
    };
    setResults(updatedResults);
    
    if (onResults) {
      onResults(newResults);
    }
  };

  // Ensure results are passed to the parent component whenever they change
  useEffect(() => {
    if (results.currentResults.length > 0 && onResults) {
      console.log('Auto-calling onResults with current results:', results.currentResults.length);
      onResults(results.currentResults);
    }
  }, [results.currentResults, onResults]);

  return {
    results,
    isSearching,
    setIsSearching,
    updateResults
  };
};
