import { useState } from 'react';
import { Result } from '@/components/ResultsTable';
import { executeSearch, loadMore } from '@/utils/searchOperations';
import { toast } from 'sonner';
import { SearchResults } from '@/types/search';
import { detectChatbot } from '@/utils/chatbotDetection';

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
    if (!url) return false;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const validateResults = (results: Result[]): Result[] => {
    return results.filter(result => {
      if (!result?.url) {
        console.log('Missing URL:', result);
        return false;
      }

      if (!isValidUrl(result.url)) {
        console.log('Invalid URL format:', result.url);
        return false;
      }

      return true;
    });
  };

  const analyzeChatbots = async (results: Result[]): Promise<Result[]> => {
    const analyzedResults = await Promise.all(
      results.map(async (result) => {
        try {
          const status = await detectChatbot(result.url);
          return {
            ...result,
            status: status || 'No chatbot detected'
          };
        } catch (error) {
          console.error(`Error analyzing ${result.url}:`, error);
          return {
            ...result,
            status: 'Error analyzing URL'
          };
        }
      })
    );
    return analyzedResults;
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
        console.log('Raw search results:', searchResult);
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

        toast.info('Analyzing websites for chatbots...');
        const analyzedResults = await analyzeChatbots(validResults);
        
        setState(prev => ({
          ...prev,
          results: {
            currentResults: analyzedResults,
            hasMore: searchResult.hasMore,
          }
        }));
        onResults(analyzedResults);
        toast.success(`Found and analyzed ${analyzedResults.length} results`);
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
        console.log('Raw more results:', moreResults);
        const validNewResults = validateResults(moreResults.newResults);
        console.log('Valid new results:', validNewResults.length);
        
        const existingUrls = new Set(state.results.currentResults.map(r => r.url));
        const uniqueResults = validNewResults.filter(result => !existingUrls.has(result.url));
        
        if (uniqueResults.length > 0) {
          toast.info('Analyzing new websites for chatbots...');
          const analyzedNewResults = await analyzeChatbots(uniqueResults);
          const updatedResults = [...state.results.currentResults, ...analyzedNewResults];
          
          setState(prev => ({
            ...prev,
            results: {
              currentResults: updatedResults,
              hasMore: moreResults.hasMore,
            }
          }));
          onResults(updatedResults);
          toast.success(`Loaded and analyzed ${analyzedNewResults.length} more results`);
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