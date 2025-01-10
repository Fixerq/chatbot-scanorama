import { useState } from 'react';
import { Result } from '@/components/ResultsTable';
import { SearchResults } from '@/types/search';

export const useSearchResults = (onResults: (results: Result[]) => void) => {
  const [results, setResults] = useState<SearchResults>({
    currentResults: [],
    hasMore: false,
  });
  const [isSearching, setIsSearching] = useState(false);

  const updateResults = (newResults: Result[], hasMore: boolean) => {
    const updatedResults = {
      currentResults: newResults,
      hasMore
    };
    setResults(updatedResults);
    onResults(newResults);
  };

  return {
    results,
    isSearching,
    setIsSearching,
    updateResults
  };
};