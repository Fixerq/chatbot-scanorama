
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
      
      // Batch analyze in smaller chunks to show progress faster
      const BATCH_SIZE = 5; // Process 5 at a time for faster feedback
      const totalBatches = Math.ceil(placeholderResults.length / BATCH_SIZE);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, placeholderResults.length);
        const batch = placeholderResults.slice(start, end);
        
        console.log(`Processing batch ${batchIndex + 1}/${totalBatches}, results ${start+1}-${end}`);
        
        try {
          // Analyze this batch
          const analyzedBatch = await analyzeChatbots(batch);
          
          if (analyzedBatch && analyzedBatch.length > 0) {
            console.log(`Batch ${batchIndex + 1} analysis complete, updating partial results`);
            
            // Send partial updates as each batch completes
            updateResults(analyzedBatch, hasMore, true);
          }
        } catch (batchError) {
          console.error(`Error analyzing batch ${batchIndex + 1}:`, batchError);
          
          // Continue with next batch even if this one fails
          const errorBatch = batch.map(result => ({
            ...result,
            status: 'Error analyzing URL'
          }));
          
          // Update with error status for this batch
          updateResults(errorBatch, hasMore, true);
        }
      }
      
      console.log('All batches processed');
    } catch (error) {
      console.error('Search execution error:', error);
      toast.error('An error occurred during search execution');
    } finally {
      setIsSearching(false);
    }
  }, [updateResults, analyzeChatbots]);

  return {
    isSearching,
    setIsSearching,
    executeSearchOperation
  };
};
