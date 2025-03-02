
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
  const [loadingPages, setLoadingPages] = useState<number[]>([]);

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
      
      // First try with the specified region
      let searchResult = await executeSearch(
        query,
        country,
        region,
        apiKey,
        resultsLimit,
        []
      );

      // If no results with the specified region, try without region
      if (!searchResult || searchResult.newResults.length === 0) {
        console.log('No results found with region. Trying without region...');
        searchResult = await executeSearch(
          query,
          country,
          '', // Empty region
          apiKey,
          resultsLimit,
          []
        );
      }

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
      
      console.log('Analyzing websites for chatbots with improved detection...');
      toast.info('Analyzing websites for chatbots...');
      
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
          toast.info(`Analyzed ${analyzedResults.length} websites, still looking for chatbots...`);
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

  const handleLoadMore = async (pageNumber?: number, forcePagination = false) => {
    if (!lastSearchParams) {
      toast.error('No search parameters available. Please perform a search first.');
      return;
    }
    
    // If no specific page is requested, load the next page
    const targetPage = pageNumber || Math.ceil(results.currentResults.length / 25) + 1;
    
    // Check if we're already loading this page
    if (loadingPages.includes(targetPage) && !forcePagination) {
      console.log(`Already loading page ${targetPage}, ignoring duplicate request`);
      return;
    }
    
    // Mark this page as loading
    setLoadingPages(prev => [...prev, targetPage]);
    setIsSearching(true);
    
    try {
      const { query, country, region } = lastSearchParams;
      
      // Calculate how many results we need based on the requested page
      const resultsPerPage = 25;
      const targetResultsCount = targetPage * resultsPerPage;
      const currentResultsCount = results.currentResults.length;
      
      console.log(`Loading more results for page ${targetPage}, currently have ${currentResultsCount} results, need ${targetResultsCount}`);
      
      if (currentResultsCount >= targetResultsCount && !forcePagination) {
        console.log(`Already have enough results for page ${targetPage}, no need to load more`);
        setIsSearching(false);
        setLoadingPages(prev => prev.filter(p => p !== targetPage));
        return;
      }
      
      toast.info(`Loading more results for page ${targetPage}...`);
      
      // If we're doing force pagination (jumping to a page), we might need to load multiple pages
      const extraResults = forcePagination ? targetResultsCount * 1.5 : targetResultsCount;
      
      const moreResults = await loadMore(
        query,
        country,
        region,
        results.currentResults,
        extraResults
      );

      if (moreResults?.newResults.length) {
        console.log(`Loaded ${moreResults.newResults.length} new results, analyzing...`);
        const analyzedNewResults = await analyzeChatbots(moreResults.newResults);
        
        // Combine existing results with new ones, ensuring no duplicates
        const allUrls = new Set(results.currentResults.map(r => r.url.toLowerCase()));
        const uniqueNewResults = analyzedNewResults.filter(r => !allUrls.has(r.url.toLowerCase()));
        
        if (uniqueNewResults.length > 0) {
          const updatedResults = [...results.currentResults, ...uniqueNewResults];
          updateResults(updatedResults, moreResults.hasMore);
          console.log(`Added ${uniqueNewResults.length} unique new results, total now ${updatedResults.length}`);
          
          const newChatbotCount = uniqueNewResults.filter(r => 
            r.details?.chatSolutions && r.details.chatSolutions.length > 0
          ).length;
          
          if (newChatbotCount > 0) {
            toast.success(`Found ${newChatbotCount} more websites with chatbots!`);
          } else {
            toast.success(`Loaded ${uniqueNewResults.length} more results`);
          }
        } else {
          console.log('No new unique results found');
          toast.info('No more new results found');
          updateResults(results.currentResults, false);
        }
      } else {
        console.log('No more results available');
        toast.info('No more results available');
        updateResults(results.currentResults, false);
      }
    } catch (error) {
      console.error('Load more error:', error);
      toast.error('Failed to load more results');
    } finally {
      setIsSearching(false);
      // Remove this page from loading pages
      setLoadingPages(prev => prev.filter(p => p !== targetPage));
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
    loadingPages
  };
};
