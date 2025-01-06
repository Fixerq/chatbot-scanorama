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

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const validateResults = (results: Result[]): Result[] => {
    return results.filter(result => {
      if (!result.url || !isValidUrl(result.url)) {
        console.log('Invalid URL:', result);
        return false;
      }

      if (!result.status || !result.details?.title) {
        console.log('Missing required fields:', result);
        return false;
      }

      return true;
    });
  };

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
        [] // Pass empty array as current results for new search
      );
      
      if (searchResult) {
        const validResults = validateResults(searchResult.newResults);
        console.log('Valid results:', validResults.length);
        
        if (validResults.length === 0) {
          toast.info('No results found. Try adjusting your search terms or location.');
          setState(prev => ({
            ...prev,
            results: {
              currentResults: [],
              hasMore: false,
            }
          }));
          onResults([]);
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
      toast.error('Search failed. Please try again.');
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

      if (moreResults?.newResults.length) {
        const validNewResults = validateResults(moreResults.newResults);
        const existingUrls = new Set(state.results.currentResults.map(r => r.url));
        const uniqueResults = validNewResults.filter(result => !existingUrls.has(result.url));
        
        if (uniqueResults.length > 0) {
          const updatedResults = [...state.results.currentResults, ...uniqueResults];
          setState(prev => ({
            ...prev,
            results: {
              currentResults: updatedResults,
              hasMore: moreResults.hasMore,
            }
          }));
          onResults(updatedResults);
          toast.success(`Loaded ${uniqueResults.length} more results`);
        } else {
          toast.info('No more new results found');
        }
      }
    } catch (error) {
      console.error('Load more error:', error);
      toast.error('Failed to load more results');
    }
  };

  return {
    results: state.results,
    isSearching: state.isSearching,
    handleSearch,
    handleLoadMore,
  };
};