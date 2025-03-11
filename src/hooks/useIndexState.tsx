
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
    console.log('New search triggered');
  }, []);

  const handlePartialResults = useCallback((partialResults: Result[]) => {
    if (partialResults.length > 0) {
      console.log(`Received ${partialResults.length} partial results`);
      setSearchPerformed(true);
      
      setResults(prevResults => {
        const updatedResults = [...prevResults];
        const existingUrls = new Set(updatedResults.map(r => r.url));
        
        partialResults.forEach(newResult => {
          const existingIndex = updatedResults.findIndex(r => r.url === newResult.url);
          if (existingIndex >= 0) {
            updatedResults[existingIndex] = newResult;
          } else {
            updatedResults.push(newResult);
          }
        });
        
        console.log(`After merging, we have ${updatedResults.length} total results`);
        return updatedResults;
      });
    } else {
      if (!searchPerformed) {
        setSearchPerformed(true);
        setResults([]);
      }
    }
  }, [searchPerformed]);

  const handleSetResults = useCallback((newResults: Result[]) => {
    console.log('Setting new results in Index:', newResults.length);
    if (newResults.length > 0) {
      setResults(newResults);
      setSearchPerformed(true);
    } else {
      if (!searchPerformed) {
        setResults([]);
        setSearchPerformed(true);
      }
    }
  }, [searchPerformed]);

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
