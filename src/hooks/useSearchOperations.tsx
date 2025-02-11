
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
        toast.error('Search failed. Please try again.');
        return;
      }

      toast.info('Analyzing websites for chatbots...');
      const analyzedResults = await analyzeChatbots(searchResult.newResults);
      
      updateResults(analyzedResults, searchResult.hasMore);
      toast.success(`Found and analyzed ${analyzedResults.length} results`);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
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
        results.currentResults,
        newLimit
      );

      if (moreResults?.newResults.length) {
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
