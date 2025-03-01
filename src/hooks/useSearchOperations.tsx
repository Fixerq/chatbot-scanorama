
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
      console.log('Starting search process with params:', { query, country, region });
      
      const searchResult = await executeSearch(
        query,
        country,
        region,
        apiKey,
        resultsLimit,
        []
      );

      if (!searchResult) {
        console.error('Search returned no results');
        toast.error('Search failed or returned no results. Please try different terms.');
        updateResults([], false);
        return;
      }

      console.log('Search returned results, analyzing chatbots...');
      toast.info('Analyzing websites for chatbots...');
      
      const analyzedResults = await analyzeChatbots(searchResult.newResults);
      
      console.log('Analysis complete:', analyzedResults);
      updateResults(analyzedResults, searchResult.hasMore);
      
      if (analyzedResults.length > 0) {
        toast.success(`Found and analyzed ${analyzedResults.length} results`);
      } else {
        toast.info('No results found. Try different search terms.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
      updateResults([], false);
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
      console.log('Loading more results for page:', currentPage);
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
