
import { useState, useCallback } from 'react';
import { executeSearch, processSearchResults } from '@/utils/search/operations';
import { Result } from '@/components/ResultsTable';
import { FirecrawlService } from '@/utils/firecrawl';
import { useChatbotAnalysis } from '@/hooks/useChatbotAnalysis';
import { toast } from 'sonner';

export const useSearchExecution = (
  updateResults: (results: Result[], hasMore: boolean, isPartialUpdate?: boolean) => void
) => {
  const [isSearching, setIsSearching] = useState(false);
  const { analyzeChatbots } = useChatbotAnalysis();

  const executeSearchOperation = useCallback(async (
    query: string,
    country: string,
    region: string,
    apiKey: string,
    resultsLimit: number
  ) => {
    console.log('Executing search operation:', { query, country, region, resultsLimit });
    
    try {
      // Save the API key for future use
      FirecrawlService.saveApiKey(apiKey);
      
      // Execute the search
      const searchData = await executeSearch(
        query,
        country,
        region,
        apiKey,
        resultsLimit
      );
      
      console.log('Search data received:', searchData ? 
        `Results: ${searchData.newResults?.length || 0}, HasMore: ${searchData.hasMore}` : 
        'No search data returned');
      
      if (!searchData) {
        console.error('Search failed or returned no data');
        setIsSearching(false);
        toast.error('Search failed. Please try again with different criteria.');
        updateResults([], false); // Make sure to update with empty results
        return;
      }
      
      if (!searchData.newResults || searchData.newResults.length === 0) {
        console.log('Search returned no results');
        setIsSearching(false);
        toast.info('No results found for your search criteria.');
        // Update with empty results to show "no results" state
        updateResults([], false);
        return;
      }
      
      // Process search results
      const { results: searchResults, hasMore } = processSearchResults(searchData);
      
      console.log(`Received ${searchResults.length} search results, hasMore: ${hasMore}`);
      
      // Mark all results as "Processing..." initially
      const placeholderResults = searchResults.map(result => ({
        ...result,
        status: 'Processing...'
      }));

      // Immediately update results with placeholders first
      updateResults(placeholderResults, hasMore);
      
      // Make a direct call to update results immediately
      try {
        // Skip chatbot analysis for initial display - just show the search results
        const initialResults = searchResults.map(result => ({
          ...result,
          status: 'Loaded, analyzing...',
          details: {
            ...result.details,
            lastChecked: new Date().toISOString()
          }
        }));
        
        // Send these to display right away
        updateResults(initialResults, hasMore, true);
        
        // Then proceed with batch analysis
        const analyzedResults = await analyzeChatbots(initialResults);
        if (analyzedResults && analyzedResults.length > 0) {
          // Update with analyzed results
          updateResults(analyzedResults, hasMore, false);
        }
      } catch (error) {
        console.error('Error during analysis:', error);
        // Still show the search results even if analysis fails
        const errorResults = placeholderResults.map(result => ({
          ...result,
          status: 'Found, analysis pending'
        }));
        updateResults(errorResults, hasMore, false);
      }
      
      setIsSearching(false);
    } catch (error) {
      console.error('Search execution error:', error);
      toast.error('An error occurred during search execution');
      // Make sure to clear the loading state and show an empty result
      updateResults([], false);
      setIsSearching(false);
    }
  }, [updateResults, analyzeChatbots]);

  return {
    isSearching,
    setIsSearching,
    executeSearchOperation
  };
};
