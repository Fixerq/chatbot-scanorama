import { useState, useEffect } from 'react';
import { FirecrawlService } from '../utils/firecrawl';
import { Result } from '@/components/ResultsTable';

interface SearchState {
  query: string;
  country: string;
  region: string;
  apiKey: string;
  resultsLimit: number;
  currentPage: number;
}

interface SearchResults {
  currentResults: Result[];
  hasMore: boolean;
}

export const useSearchState = () => {
  const initialState: SearchState = {
    query: '',
    country: '',
    region: '',
    apiKey: '',
    resultsLimit: 10,
    currentPage: 1,
  };

  const [searchState, setSearchState] = useState<SearchState>(initialState);
  const [results, setResults] = useState<SearchResults>({
    currentResults: [],
    hasMore: false,
  });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const savedApiKey = FirecrawlService.getApiKey();
    if (savedApiKey) {
      setSearchState(prev => ({ ...prev, apiKey: savedApiKey }));
    }
  }, []);

  const resetSearch = () => {
    setSearchState(prev => ({
      ...initialState,
      apiKey: prev.apiKey // Preserve the API key
    }));
    setResults({
      currentResults: [],
      hasMore: false,
    });
  };

  const updateSearchState = (updates: Partial<SearchState>) => {
    setSearchState(prev => ({ ...prev, ...updates }));
  };

  return {
    searchState,
    results,
    isSearching,
    setIsSearching,
    setResults,
    resetSearch,
    updateSearchState,
  };
};