import { useState } from 'react';
import { Result } from '@/components/ResultsTable';
import { executeSearch, loadMore } from '@/utils/searchOperations';
import { toast } from 'sonner';
import { SearchResults } from '@/types/search';

interface SearchOperationsState {
  results: SearchResults;
  isSearching: boolean;
}

export const useSearchOperations = (onResults: (results: Result[]) => void) => {
  const [state, setState] = useState<SearchOperationsState>({
    results: {
      currentResults: [],
      hasMore: false,
    },
    isSearching: false,
  });

  const handleSearch = async (
    query: string,
    country: string,
    region: string,
    apiKey: string,
    resultsLimit: number
  ) => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (!country) {
      toast.error('Please select a country');
      return;
    }

    setState(prev => ({ ...prev, isSearching: true }));
    
    try {
      // Reset results before starting new search
      setState(prev => ({
        ...prev,
        results: {
          currentResults: [],
          hasMore: false,
        }
      }));
      
      const searchResult = await executeSearch(
        query,
        country,
        region,
        apiKey,
        resultsLimit,
        []
      );
      
      if (searchResult) {
        const validResults = searchResult.newResults.filter(result => result.url);
        
        if (validResults.length === 0) {
          toast.info('No valid results found. Try adjusting your search terms.');
          return;
        }

        setState(prev => ({
          ...prev,
          results: {
            currentResults: validResults,
            hasMore: searchResult.hasMore,
          }
        }));
        onResults(validResults);
        toast.success(`Found ${validResults.length} results`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to perform search. Please try again.');
    } finally {
      setState(prev => ({ ...prev, isSearching: false }));
    }
  };

  const handleLoadMore = async (
    query: string,
    country: string,
    region: string,
    currentPage: number,
    newLimit: number
  ) => {
    try {
      const moreResults = await loadMore(
        query,
        country,
        region,
        state.results.currentResults,
        newLimit
      );

      if (moreResults && moreResults.newResults.length > 0) {
        const validNewResults = moreResults.newResults.filter(result => result.url);
        const existingUrls = new Set(state.results.currentResults.map(r => r.url));
        const newUniqueResults = validNewResults.filter(result => !existingUrls.has(result.url));
        
        if (newUniqueResults.length > 0) {
          const updatedResults = [...state.results.currentResults, ...newUniqueResults];
          setState(prev => ({
            ...prev,
            results: {
              currentResults: updatedResults,
              hasMore: moreResults.hasMore,
            }
          }));
          onResults(updatedResults);
          toast.success(`Loaded ${newUniqueResults.length} more results`);
        } else {
          toast.info('No more new results found');
        }
      }
    } catch (error) {
      console.error('Load more error:', error);
      toast.error('Failed to load more results. Please try again.');
    }
  };

  return {
    results: state.results,
    isSearching: state.isSearching,
    handleSearch,
    handleLoadMore,
  };
};