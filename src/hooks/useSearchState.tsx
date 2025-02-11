
import { useState, useEffect, useCallback } from 'react';
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
      if (location.pathname === '/login') {
        return;
      }

      try {
        // TODO: Implement API key retrieval from Supabase
        // For now, we'll use an empty implementation
        if (isMounted) {
          setSearchState(prev => ({
            ...prev,
            apiKey: ''
          }));
        }
      } catch (error) {
        console.error('API key initialization error');
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
      apiKey: prev.apiKey
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
