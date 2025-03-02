
import { Result } from '@/components/ResultsTable';
import { loadMore } from '@/utils/search/operations';
import { useState } from 'react';
import { toast } from 'sonner';
import { useChatbotAnalysis } from '../useChatbotAnalysis';

export const usePagination = (
  currentResults: Result[],
  updateResults: (results: Result[], hasMore: boolean) => void,
  setIsSearching: (isSearching: boolean) => void
) => {
  const [loadingPages, setLoadingPages] = useState<number[]>([]);
  const { analyzeChatbots } = useChatbotAnalysis();

  const handleLoadMore = async (
    pageNumber: number,
    forcePagination = false,
    lastSearchParams: {
      query: string;
      country: string;
      region: string;
    } | null
  ) => {
    if (!lastSearchParams) {
      toast.error('No search parameters available. Please perform a search first.');
      return;
    }
    
    // If no specific page is requested, load the next page
    const targetPage = pageNumber || Math.ceil(currentResults.length / 25) + 1;
    
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
      const currentResultsCount = currentResults.length;
      
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
        currentResults,
        extraResults
      );

      if (moreResults?.newResults.length) {
        console.log(`Loaded ${moreResults.newResults.length} new results, analyzing...`);
        const analyzedNewResults = await analyzeChatbots(moreResults.newResults);
        
        // Combine existing results with new ones, ensuring no duplicates
        const allUrls = new Set(currentResults.map(r => r.url.toLowerCase()));
        const uniqueNewResults = analyzedNewResults.filter(r => !allUrls.has(r.url.toLowerCase()));
        
        if (uniqueNewResults.length > 0) {
          const updatedResults = [...currentResults, ...uniqueNewResults];
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
          
          // Even if no new results were found, we should respect the hasMore flag
          // from the API to continue showing the Load More button if appropriate
          updateResults(currentResults, moreResults.hasMore);
        }
      } else {
        console.log('No more results available');
        toast.info('No more results available');
        updateResults(currentResults, false);
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
    loadingPages,
    handleLoadMore
  };
};
