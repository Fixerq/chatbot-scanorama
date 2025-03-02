
import { useState } from 'react';
import { Result } from '@/components/ResultsTable';
import { SearchResults } from '@/types/search';

export const useResultsState = (onResults: (results: Result[]) => void) => {
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

  return {
    results,
    isSearching,
    setIsSearching,
    updateResults
  };
};
