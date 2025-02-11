
import { Result } from '@/components/ResultsTable';
import { executeSearch, loadMore } from '@/utils/searchOperations';
import { toast } from 'sonner';
import { useSearchResults } from './useSearchResults';
import { useSearchValidation } from './useSearchValidation';
import { useChatbotAnalysis } from './useChatbotAnalysis';

export const useSearchOperations = (onResults: (results: Result[]) => void) => {
  const { results, isSearching, setIsSearching, updateResults } = useSearchResults(onResults);
  const { validateSearchParams } = useSearchValidation();
  const { analyzeChatbots } = useChatbotAnalysis();

  const handleSearch = async (
    query: string,
    country: string,
    region: string,
    apiKey: string,
    resultsLimit: number
  ) => {
    if (!validateSearchParams(query, country)) return;

    console.log('Starting search operation');
    setIsSearching(true);
    
    try {
      const searchResult = await executeSearch(
        query,
        country,
        region,
        apiKey,
        resultsLimit,
        []
      );

      if (!searchResult) {
        console.log('Search returned null result');
        toast.error('Search failed. Please try again.');
        return;
      }

      console.log('Starting chatbot analysis');
      toast.info('Analyzing websites for chatbots...');
      const analyzedResults = await analyzeChatbots(searchResult.newResults);
      console.log('Chatbot analysis complete:', analyzedResults.length);
      
      updateResults(analyzedResults, searchResult.hasMore);
      toast.success(`Found and analyzed ${analyzedResults.length} results`);
    } catch (error) {
      console.error('Search operation error:', error);
      toast.error(error.message || 'Search failed. Please try again.');
    } finally {
      setIsSearching(false);
      console.log('Search operation complete');
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
      console.log('Loading more results');
      const moreResults = await loadMore(
        query,
        country,
        region,
        results.currentResults,
        newLimit
      );

      if (moreResults?.newResults.length) {
        console.log('Analyzing new batch of results');
        const analyzedNewResults = await analyzeChatbots(moreResults.newResults);
        const updatedResults = [...results.currentResults, ...analyzedNewResults];
        
        updateResults(updatedResults, moreResults.hasMore);
        toast.success(`Loaded and analyzed ${analyzedNewResults.length} more results`);
      } else {
        toast.info('No more new results found');
      }
    } catch (error) {
      console.error('Load more error:', error);
      toast.error('Failed to load more results');
    }
  };

  return {
    results,
    isSearching,
    handleSearch,
    handleLoadMore,
  };
};
