
import { Result } from '@/components/ResultsTable';
import { executeSearch, loadMore } from '@/utils/searchOperations';
import { toast } from 'sonner';
import { useSearchResults } from './useSearchResults';
import { useSearchValidation } from './useSearchValidation';
import { useChatbotAnalysis } from './useChatbotAnalysis';
import { useState } from 'react';

export const useSearchOperations = (onResults: (results: Result[]) => void) => {
  const { results, isSearching, setIsSearching, updateResults } = useSearchResults(onResults);
  const { validateSearchParams } = useSearchValidation();
  const { analyzeChatbots } = useChatbotAnalysis();
  const [hasMore, setHasMore] = useState(false);
  const [lastSearchParams, setLastSearchParams] = useState<{
    query: string;
    country: string;
    region: string;
    apiKey: string;
    resultsLimit: number;
  } | null>(null);

  const handleSearch = async (
    query: string,
    country: string,
    region: string,
    apiKey: string,
    resultsLimit: number
  ) => {
    if (!validateSearchParams(query, country)) return;

    setIsSearching(true);
    
    // Save the search parameters for later use in pagination
    setLastSearchParams({
      query,
      country,
      region,
      apiKey,
      resultsLimit
    });
    
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

      console.log('Search returned results count:', searchResult.newResults.length);
      setHasMore(searchResult.hasMore);
      
      if (searchResult.newResults.length === 0) {
        toast.info('No results found. Try different search terms.');
        updateResults([], false);
        return;
      }
      
      console.log('Analyzing websites for chatbots with enhanced verification...');
      toast.info('Analyzing websites for chatbots with enhanced verification...');
      
      const analyzedResults = await analyzeChatbots(searchResult.newResults);
      
      console.log('Analysis complete. Results count:', analyzedResults.length);
      updateResults(analyzedResults, searchResult.hasMore);
      
      if (analyzedResults.length > 0) {
        const chatbotCount = analyzedResults.filter(r => 
          r.details?.chatSolutions && r.details.chatSolutions.length > 0
        ).length;
        
        if (chatbotCount > 0) {
          toast.success(`Found ${chatbotCount} websites with chatbots out of ${analyzedResults.length} results`);
        } else {
          toast.info(`Analyzed ${analyzedResults.length} websites, no chatbots detected`);
        }
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
    pageNumber?: number
  ) => {
    if (!lastSearchParams) {
      toast.error('No search parameters available. Please perform a search first.');
      return;
    }
    
    try {
      const { query, country, region, resultsLimit } = lastSearchParams;
      
      // Calculate how many results we need based on the requested page
      const resultsPerPage = 25;
      const targetPage = pageNumber || Math.ceil(results.currentResults.length / resultsPerPage) + 1;
      const targetResultsCount = targetPage * resultsPerPage;
      const additionalResultsNeeded = Math.max(0, targetResultsCount - results.currentResults.length);
      
      // Only proceed if we need more results
      if (additionalResultsNeeded <= 0) {
        console.log('No additional results needed for page:', targetPage);
        return;
      }
      
      console.log(`Loading more results for page ${targetPage}, need ${additionalResultsNeeded} more results`);
      
      // Set a new limit based on how many additional results we need
      const newLimit = results.currentResults.length + Math.max(10, additionalResultsNeeded);
      
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
    results: { 
      currentResults: results.currentResults, 
      hasMore: results.hasMore || hasMore 
    },
    isSearching,
    handleSearch,
    handleLoadMore,
  };
};
