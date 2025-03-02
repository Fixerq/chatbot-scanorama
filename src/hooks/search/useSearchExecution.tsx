
import { Result } from '@/components/ResultsTable';
import { executeSearch } from '@/utils/search/operations';
import { toast } from 'sonner';
import { useState } from 'react';
import { useChatbotAnalysis } from '../useChatbotAnalysis';

export const useSearchExecution = (updateResults: (results: Result[], hasMore: boolean) => void) => {
  const [isSearching, setIsSearching] = useState(false);
  const { analyzeChatbots } = useChatbotAnalysis();
  
  const executeSearchOperation = async (
    query: string,
    country: string,
    region: string,
    apiKey: string,
    resultsLimit: number
  ) => {
    setIsSearching(true);
    
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

  return {
    isSearching,
    setIsSearching,
    executeSearchOperation
  };
};
