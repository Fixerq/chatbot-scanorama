
import { useState } from 'react';
import { Result } from '@/components/ResultsTable';
import { SearchResults } from '@/types/search';

export const useSearchResults = (onResults: (results: Result[]) => void) => {
  const [results, setResults] = useState<SearchResults>({
    currentResults: [],
    hasMore: false,
    nextPageToken: undefined
  });
  const [isSearching, setIsSearching] = useState(false);

  const updateResults = (newResults: Result[], hasMore: boolean, nextPageToken?: string) => {
    const updatedResults = {
      currentResults: newResults,
      hasMore,
      nextPageToken
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
