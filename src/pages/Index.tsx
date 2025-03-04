
import React, { useState, useCallback, useEffect } from 'react';
import NavigationBar from '@/components/NavigationBar';
import Header from '@/components/Header';
import SearchFormContainer from '@/components/SearchFormContainer';
import Results from '@/components/Results';
import { Result } from '@/components/ResultsTable';
import { UserStatusCheck } from '@/components/UserStatusCheck';
import { toast } from 'sonner';
import { useChatbotAnalysis } from '@/hooks/useChatbotAnalysis';

const Index = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [newSearchTrigger, setNewSearchTrigger] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const { analyzeChatbots } = useChatbotAnalysis();

  const handleNewSearch = useCallback(() => {
    setResults([]);
    setNewSearchTrigger(prev => !prev);
    setSearchPerformed(false);
    console.log('New search triggered');
  }, []);

  // Process partial result updates - show results as they become available
  const handlePartialResults = useCallback((partialResults: Result[]) => {
    if (partialResults.length > 0) {
      console.log(`Received ${partialResults.length} partial results`);
      setSearchPerformed(true);
      
      // Merge new results with existing ones, replacing any with matching URLs
      setResults(prevResults => {
        const updatedResults = [...prevResults];
        const existingUrls = new Set(updatedResults.map(r => r.url));
        
        partialResults.forEach(newResult => {
          const existingIndex = updatedResults.findIndex(r => r.url === newResult.url);
          if (existingIndex >= 0) {
            // Replace existing result
            updatedResults[existingIndex] = newResult;
          } else {
            // Add new result
            updatedResults.push(newResult);
          }
        });
        
        return updatedResults;
      });
    }
  }, []);

  const handleResultUpdate = async (updatedResult: Result) => {
    console.log('Triggering result update for:', updatedResult);
    
    // Find the result and mark it as reanalyzing
    setResults(prev => prev.map(result => 
      result.url === updatedResult.url ? 
        { ...result, status: 'Processing...', details: { ...result.details, chatSolutions: [] } } : 
        result
    ));
    
    try {
      // Enhanced result update with deep verification option
      toast.info(`Re-analyzing ${updatedResult.url} with enhanced verification...`);
      
      // Re-analyze just the one result with enhanced verification
      const reanalyzed = await analyzeChatbots([{
        ...updatedResult, 
        status: 'Processing...', 
        details: { ...updatedResult.details, chatSolutions: [] }
      }]);
      
      if (reanalyzed && reanalyzed.length > 0) {
        // Update the result in the results array
        setResults(prev => prev.map(result => 
          result.url === updatedResult.url ? reanalyzed[0] : result
        ));
        
        const hasChatbot = reanalyzed[0].details?.chatSolutions && reanalyzed[0].details.chatSolutions.length > 0;
        if (hasChatbot) {
          toast.success('Analysis refreshed: Chatbot detected');
        } else {
          toast.success('Analysis refreshed: No chatbot detected');
        }
      } else {
        // Handle error case
        setResults(prev => prev.map(result => 
          result.url === updatedResult.url ? 
            { ...result, status: 'Analysis failed' } : 
            result
        ));
        toast.error('Failed to refresh analysis');
      }
    } catch (error) {
      console.error('Error during result update:', error);
      setResults(prev => prev.map(result => 
        result.url === updatedResult.url ? 
          { ...result, status: 'Error during analysis' } : 
          result
      ));
      toast.error('Error refreshing analysis');
    }
  };

  // Debug log when results change
  useEffect(() => {
    console.log('Results updated in Index component:', { 
      count: results.length, 
      hasResults: results.length > 0,
      isProcessing,
      hasMore
    });
  }, [results, isProcessing, hasMore]);

  const handleSetResults = useCallback((newResults: Result[]) => {
    console.log('Setting new results in Index:', newResults.length);
    setResults(newResults);
    setSearchPerformed(true);
  }, []);

  const handleSetMoreInfo = useCallback((hasMoreResults: boolean) => {
    console.log('Setting hasMore status:', hasMoreResults);
    setHasMore(hasMoreResults);
  }, []);

  const handleSetProcessing = useCallback((processing: boolean) => {
    console.log('Setting processing state:', processing);
    setIsProcessing(processing);
  }, []);

  const handleLoadMore = useCallback((page: number) => {
    console.log('Load more triggered for page:', page);
    setIsLoadingMore(true);
    
    // We need a small delay to allow the UI to update with loading state
    setTimeout(() => {
      const searchFormContainer = document.querySelector('#search-form-container');
      if (searchFormContainer) {
        const loadMoreButton = searchFormContainer.querySelector('button');
        if (loadMoreButton) {
          console.log('Automatically clicking load more button');
          loadMoreButton.click();
        } else {
          console.log('Load more button not found in search form container');
          // Fallback: try to find the LoadMoreButton directly in the Results component
          const resultsLoadMoreButton = document.querySelector('.mt-6 button');
          if (resultsLoadMoreButton) {
            console.log('Found load more button in Results component');
            (resultsLoadMoreButton as HTMLButtonElement).click();
          } else {
            console.log('Load more button not found in Results component either');
          }
        }
      } else {
        console.log('Search form container not found');
      }
      
      // Set timeout to reset loading state if it takes too long
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 30000);
    }, 100);
  }, []);

  // Reset loading more state when processing state changes
  useEffect(() => {
    if (!isProcessing && isLoadingMore) {
      setIsLoadingMore(false);
    }
  }, [isProcessing, isLoadingMore]);

  return (
    <div className="min-h-screen bg-black">
      <NavigationBar />
      <div className="container py-8">
        <Header />
        <div className="mb-4">
          <UserStatusCheck />
        </div>
        <div id="search-form-container">
          <SearchFormContainer 
            onResults={handleSetResults}
            onPartialResults={handlePartialResults}
            onHasMoreChange={handleSetMoreInfo}
            isProcessing={isProcessing}
            setIsProcessing={handleSetProcessing}
            triggerNewSearch={newSearchTrigger}
          />
        </div>
        
        {/* Show Results component as soon as we have partial results */}
        {(searchPerformed || results.length > 0) && (
          <Results 
            results={results}
            onExport={() => {}} 
            onNewSearch={handleNewSearch}
            onResultUpdate={handleResultUpdate}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            isLoadingMore={isLoadingMore}
            isAnalyzing={isProcessing}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
