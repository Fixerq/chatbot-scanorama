
import { useState, useEffect, useCallback } from 'react';
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
    resultsLimit: 25,
    currentPage: 1,
  };

  const [searchState, setSearchState] = useState<SearchState>(initialState);
  const [results, setResults] = useState<SearchResults>({
    currentResults: [],
    hasMore: false,
  });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeApiKey = async () => {
      try {
        const apiKey = await FirecrawlService.getApiKey();
        if (isMounted) {
          setSearchState(prev => ({
            ...prev,
            apiKey: apiKey || '' // Ensure we always set a string, even if empty
          }));
        }
      } catch (error) {
        console.error('Error initializing API key:', error);
      }
    };

    initializeApiKey();

    return () => {
      isMounted = false;
    };
  }, []);

  const resetSearch = useCallback(() => {
    setSearchState(prev => ({
      ...initialState,
      apiKey: prev.apiKey // Preserve the API key when resetting
    }));
    setResults({
      currentResults: [],
      hasMore: false,
    });
  }, []);

  const updateSearchState = useCallback((updates: Partial<SearchState>) => {
    setSearchState(prev => ({ ...prev, ...updates }));
  }, []);

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
