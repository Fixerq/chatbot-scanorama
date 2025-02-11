
import { useState, useEffect, useCallback } from 'react';
import { FirecrawlService } from '../utils/firecrawl';
import { Result } from '@/components/ResultsTable';
import { useLocation } from 'react-router-dom';

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
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const initializeApiKey = async () => {
      // Skip API key initialization on login page
      if (location.pathname === '/login') {
        return;
      }

      try {
        const apiKey = await FirecrawlService.getApiKey();
        if (isMounted && apiKey) {
          setSearchState(prev => ({
            ...prev,
            apiKey
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
  }, [location.pathname]);

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
