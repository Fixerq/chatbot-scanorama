
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
      
      // IMMEDIATELY display raw Google Places results with minimal processing
      const initialResults = searchResults.map(result => ({
        ...result,
        status: 'Found, analyzing...',
        details: {
          ...result.details,
          title: result.details?.title || 'Loading business info...',
          lastChecked: new Date().toISOString()
        }
      }));
      
      // Update the UI with these results immediately
      updateResults(initialResults, hasMore, false);
      
      // Set searching to false AFTER displaying initial results
      setIsSearching(false);
      
      // Now start the analysis process in the background
      try {
        // Run chatbot analysis after initial results are displayed
        const analyzedResults = await analyzeChatbots(initialResults);
        
        if (analyzedResults && analyzedResults.length > 0) {
          // Update with analyzed results, but don't replace all results
          updateResults(analyzedResults, hasMore, true);
        }
      } catch (error) {
        console.error('Error during analysis:', error);
        // Analysis failed, but we already showed the initial results, so don't clear them
        toast.error('Analysis encountered an error, but search results are displayed');
      }
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
