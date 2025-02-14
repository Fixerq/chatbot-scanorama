
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
  nextPageToken?: string;
  lastSearch?: {
    query: string;
    country: string;
    region: string;
  };
}

interface SearchResults {
  currentResults: Result[];
  hasMore: boolean;
  nextPageToken?: string;
}

export const useSearchState = () => {
  const initialState: SearchState = {
    query: '',
    country: '',
    region: '',
    apiKey: '',
    resultsLimit: 25,
    currentPage: 1,
    nextPageToken: undefined,
    lastSearch: undefined
  };

  const [searchState, setSearchState] = useState<SearchState>(initialState);
  const [results, setResults] = useState<SearchResults>({
    currentResults: [],
    hasMore: false,
    nextPageToken: undefined
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
      nextPageToken: undefined
    });
  }, []);

  const updateSearchState = useCallback((updates: Partial<SearchState>) => {
    setSearchState(prev => {
      // If this is a new search (query, country, or region changed), store it as lastSearch
      if (
        updates.query !== undefined || 
        updates.country !== undefined || 
        updates.region !== undefined
      ) {
        return {
          ...prev,
          ...updates,
          lastSearch: {
            query: updates.query || prev.query,
            country: updates.country || prev.country,
            region: updates.region || prev.region
          }
        };
      }
      return { ...prev, ...updates };
    });
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
