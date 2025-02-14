
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
  const [currentSearchParams, setCurrentSearchParams] = useState<{
    query: string;
    country: string;
    region: string;
  }>({
    query: '',
    country: '',
    region: ''
  });

  const startAnalysis = async (searchResults: Result[]) => {
    setIsAnalyzing(true);
    console.log('Starting chatbot analysis for', searchResults.length, 'results');
    
    try {
      // Process in parallel batches of 10 to balance speed and server load
      const batchSize = 10;
      const analyzedResults: Result[] = [...searchResults];
      const totalBatches = Math.ceil(searchResults.length / batchSize);
      
      for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
        const start = batchNum * batchSize;
        const batch = searchResults.slice(start, start + batchSize);
        
        // Process each batch in parallel with a 15-second timeout
        const analysisPromises = batch.map(async (result, index) => {
          try {
            const timeout = new Promise<Result>((_, reject) => {
              setTimeout(() => reject(new Error('Analysis timeout')), 15000);
            });

            const analysis = analyzeChatbots([result]).then(res => res[0]);
            const analyzedResult = await Promise.race([analysis, timeout]);
            analyzedResults[start + index] = analyzedResult;
            return analyzedResult;
          } catch (error) {
            console.error(`Error analyzing ${result.url}:`, error);
            return {
              ...result,
              status: 'Error: Analysis timeout',
              details: {
                ...result.details,
                lastChecked: new Date().toISOString()
              }
            };
          }
        });

        // Wait for the current batch to complete
        await Promise.all(analysisPromises);
        
        // Update UI with progress
        updateResults(analyzedResults, results.hasMore);
        
        // Show progress toast every 20 results or at the end
        const processedCount = Math.min((batchNum + 1) * batchSize, searchResults.length);
        if (processedCount % 20 === 0 || processedCount === searchResults.length) {
          toast.info(`Analyzed ${processedCount} of ${searchResults.length} websites`);
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
    
    // Store the current search parameters for load more functionality
    setCurrentSearchParams({ query, country, region });
    
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
      console.log('Loading more results with params:', currentSearchParams);
      const moreResults = await loadMore(
        currentSearchParams.query,
        currentSearchParams.country,
        currentSearchParams.region,
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
