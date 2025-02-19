
import React, { useState, useCallback, useRef, useEffect } from 'react';
import NavigationBar from '@/components/NavigationBar';
import Header from '@/components/Header';
import SearchFormContainer from '@/components/SearchFormContainer';
import Results from '@/components/Results';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';
import { useSearchOperations } from '@/hooks/useSearchOperations';
import { useUrlProcessor } from '@/hooks/useUrlProcessor';

const Index = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newSearchTrigger, setNewSearchTrigger] = useState(false);
  const [searchParams, setSearchParams] = useState({
    query: '',
    country: '',
    region: ''
  });
  
  const { handleLoadMore, isSearching } = useSearchOperations(setResults);
  const { processSearchResults } = useUrlProcessor();
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleNewSearch = useCallback(() => {
    if (mounted.current) {
      setResults([]);
      setNewSearchTrigger(prev => !prev);
    }
  }, []);

  const handleSearchError = useCallback((error: Error) => {
    console.error('Search error:', error);
    if (mounted.current) {
      toast.error('An error occurred during search. Please try again.');
    }
  }, []);

  const handleResultUpdate = useCallback((updatedResult: Result) => {
    if (mounted.current) {
      setResults(prevResults => 
        prevResults.map(result => 
          result.url === updatedResult.url ? updatedResult : result
        )
      );
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    if (mounted.current) {
      handleLoadMore(
        searchParams.query,
        searchParams.country, 
        searchParams.region,
        page, 
        (page + 1) * 50
      );
    }
  }, [handleLoadMore, searchParams]);

  const handleResults = useCallback(async (newResults: Result[]) => {
    if (mounted.current) {
      setResults(newResults);
      // Automatically trigger analysis for new results
      await processSearchResults(
        newResults,
        () => setIsAnalyzing(true),
        () => setIsAnalyzing(false)
      );
    }
  }, [processSearchResults]);

  return (
    <div className="min-h-screen bg-black">
      <NavigationBar />
      <div className="container py-8">
        <Header />
        <SearchFormContainer 
          onResults={handleResults}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          triggerNewSearch={newSearchTrigger}
          onError={handleSearchError}
          onSearchParamsChange={setSearchParams}
        />
        <Results 
          results={results}
          onExport={() => {}} 
          onNewSearch={handleNewSearch}
          hasMore={true}
          onLoadMore={handlePageChange}
          isLoadingMore={isSearching}
          isAnalyzing={isAnalyzing}
          onResultUpdate={handleResultUpdate}
        />
      </div>
    </div>
  );
};

export default Index;
