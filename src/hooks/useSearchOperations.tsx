
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startAnalysis = async (searchResults: Result[]) => {
    setIsAnalyzing(true);
    console.log('Starting chatbot analysis for', searchResults.length, 'results');
    
    try {
      // Analyze in batches of 5 to avoid overwhelming the server
      const batchSize = 5;
      const analyzedResults: Result[] = [...searchResults];
      
      for (let i = 0; i < searchResults.length; i += batchSize) {
        const batch = searchResults.slice(i, i + batchSize);
        const analyzedBatch = await analyzeChatbots(batch);
        
        // Update the results for this batch
        analyzedBatch.forEach((analyzed, index) => {
          analyzedResults[i + index] = analyzed;
        });
        
        // Update the UI with progress
        updateResults(analyzedResults, results.hasMore);
        
        // Show progress toast every 5 results
        if ((i + batchSize) % 10 === 0 || i + batchSize >= searchResults.length) {
          toast.info(`Analyzed ${Math.min(i + batchSize, searchResults.length)} of ${searchResults.length} websites`);
        }
      }
      
      toast.success(`Completed analysis of ${searchResults.length} websites`);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Some websites could not be analyzed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSearch = async (
    query: string,
    country: string,
    region: string,
    apiKey: string,
    resultsLimit: number
  ) => {
    if (!validateSearchParams(query, country)) return;

    console.log('Starting search operation');
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
        console.log('Search returned null result');
        toast.error('Search failed. Please try again.');
        return;
      }

      // Immediately show the search results
      updateResults(searchResult.newResults, searchResult.hasMore);
      toast.success(`Found ${searchResult.newResults.length} results`);

      // Start analysis in the background
      startAnalysis(searchResult.newResults);
      
    } catch (error) {
      console.error('Search operation error:', error);
      toast.error(error.message || 'Search failed. Please try again.');
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
      console.log('Loading more results');
      const moreResults = await loadMore(
        query,
        country,
        region,
        results.currentResults,
        newLimit
      );

      if (moreResults?.newResults.length) {
        // Add new results immediately
        const updatedResults = [...results.currentResults, ...moreResults.newResults];
        updateResults(updatedResults, moreResults.hasMore);
        toast.success(`Loaded ${moreResults.newResults.length} more results`);
        
        // Start analysis of new results
        startAnalysis(moreResults.newResults);
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
    isAnalyzing,
    handleSearch,
    handleLoadMore,
  };
};

