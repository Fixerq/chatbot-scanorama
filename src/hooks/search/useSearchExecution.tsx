
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
  const { analyzeChatbots, analysisStage } = useChatbotAnalysis();

  const executeSearchOperation = useCallback(async (
    query: string,
    country: string,
    region: string,
    apiKey: string,
    resultsLimit: number
  ) => {
    console.log('Executing search operation:', { query, country, region, resultsLimit });
    
    try {
      FirecrawlService.saveApiKey(apiKey);
      
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
        updateResults([], false);
        return;
      }
      
      if (!searchData.newResults || searchData.newResults.length === 0) {
        console.log('Search returned no results');
        setIsSearching(false);
        toast.info('No results found for your search criteria.');
        updateResults([], false);
        return;
      }
      
      // Map initial results with basic info and analyzing status
      const initialResults = searchData.newResults.map(result => ({
        id: result.id,
        url: result.url,
        status: 'Preparing for analysis...',
        details: {
          title: result.details?.title || 'Loading business info...',
          description: result.details?.description || '',
          lastChecked: new Date().toISOString()
        },
        _metadata: result._metadata || {}
      }));
      
      // Update UI with initial results immediately
      console.log(`Updating UI with ${initialResults.length} initial results`);
      updateResults(initialResults, searchData.hasMore, false);
      
      // Start analysis immediately and show status
      try {
        // First partial update to show analysis is starting
        const startingAnalysisResults = initialResults.map(result => ({
          ...result,
          status: 'Starting chatbot detection...'
        }));
        updateResults(startingAnalysisResults, searchData.hasMore, true);
        
        // Immediately run analysis (no waiting)
        const analyzedResults = await analyzeChatbots(initialResults);
        
        if (analyzedResults && analyzedResults.length > 0) {
          console.log(`Updating with ${analyzedResults.length} analyzed results`);
          // This is a complete replacement of results
          updateResults(analyzedResults, searchData.hasMore, true);
          
          // Count chatbots detected
          const chatbotCount = analyzedResults.filter(r => 
            r.details?.chatSolutions && r.details.chatSolutions.length > 0
          ).length;
          
          if (chatbotCount > 0) {
            toast.success(`Found ${chatbotCount} sites with chatbots`, {
              description: `Successfully analyzed ${analyzedResults.length} websites`
            });
          } else {
            toast.info(`No chatbots found in the ${analyzedResults.length} analyzed websites`);
          }
        }
      } catch (error) {
        console.error('Analysis error:', error);
        toast.error('Analysis encountered an error, but search results are displayed');
      } finally {
        setIsSearching(false);
      }
    } catch (error) {
      console.error('Search execution error:', error);
      toast.error('An error occurred during search execution');
      updateResults([], false);
      setIsSearching(false);
    }
  }, [updateResults, analyzeChatbots]);

  return {
    isSearching,
    setIsSearching,
    executeSearchOperation,
    analysisStage
  };
};
