
import { useState, useCallback, useEffect } from 'react';
import { Result } from '@/components/ResultsTable';

export function useIndexState() {
  const [results, setResults] = useState<Result[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [newSearchTrigger, setNewSearchTrigger] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleNewSearch = useCallback(() => {
    setResults([]);
    setNewSearchTrigger(prev => !prev);
    setSearchPerformed(false);
    console.log('New search triggered, clearing results');
  }, []);

  const handlePartialResults = useCallback((partialResults: Result[]) => {
    if (!partialResults || partialResults.length === 0) {
      console.log('Received empty partial results');
      return;
    }

    console.log(`Received ${partialResults.length} partial results`);
    setSearchPerformed(true);
    
    setResults(prevResults => {
      const updatedResults = [...prevResults];
      const existingUrls = new Set(updatedResults.map(r => r.url));
      
      let updated = false;
      partialResults.forEach(newResult => {
        if (!newResult.url) {
          console.warn('Skipping result without URL:', newResult);
          return;
        }

        const existingIndex = updatedResults.findIndex(r => r.url === newResult.url);
        if (existingIndex >= 0) {
          updatedResults[existingIndex] = newResult;
          updated = true;
        } else {
          updatedResults.push(newResult);
          updated = true;
        }
      });
      
      console.log(`After merging, we have ${updatedResults.length} total results${updated ? ' (updated)' : ''}`);
      return updated ? updatedResults : prevResults;
    });
  }, []);

  const handleSetResults = useCallback((newResults: Result[], hasMoreResults: boolean) => {
    console.log('Setting new results:', { count: newResults?.length, hasMore: hasMoreResults });
    
    if (newResults && newResults.length > 0) {
      setResults(newResults);
      setHasMore(hasMoreResults);
      setSearchPerformed(true);
      console.log('Results updated successfully');
    } else {
      console.log('No results to set, clearing state');
      setResults([]);
      setHasMore(false);
      setSearchPerformed(true);
    }
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
    
    setTimeout(() => {
      const searchFormContainer = document.querySelector('#search-form-container');
      if (searchFormContainer) {
        const loadMoreButton = searchFormContainer.querySelector('button');
        if (loadMoreButton) {
          console.log('Automatically clicking load more button');
          loadMoreButton.click();
        }
      }
      
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 30000);
    }, 100);
  }, []);

  useEffect(() => {
    if (!isProcessing && isLoadingMore) {
      setIsLoadingMore(false);
    }
  }, [isProcessing, isLoadingMore]);

  return {
    results,
    isProcessing,
    isLoadingMore,
    newSearchTrigger,
    hasMore,
    searchPerformed,
    handleNewSearch,
    handlePartialResults,
    handleSetResults,
    handleSetMoreInfo,
    handleSetProcessing,
    handleLoadMore
  };
}
