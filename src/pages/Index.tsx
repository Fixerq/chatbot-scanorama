
import React, { useState, useCallback } from 'react';
import NavigationBar from '@/components/NavigationBar';
import Header from '@/components/Header';
import SearchFormContainer from '@/components/SearchFormContainer';
import Results from '@/components/Results';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';
import { useSearchOperations } from '@/hooks/useSearchOperations';

const Index = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newSearchTrigger, setNewSearchTrigger] = useState(false);
  const [searchParams, setSearchParams] = useState({
    query: '',
    country: '',
    region: ''
  });
  
  const { handleLoadMore, isSearching } = useSearchOperations(setResults);

  const handleNewSearch = useCallback(() => {
    setResults([]);
    setNewSearchTrigger(prev => !prev);
  }, []);

  const handleSearchError = useCallback((error: Error) => {
    console.error('Search error:', error);
    toast.error('An error occurred during search. Please try again.');
  }, []);

  const handlePageChange = useCallback((page: number) => {
    handleLoadMore(
      searchParams.query,
      searchParams.country, 
      searchParams.region,
      page, 
      (page + 1) * 50
    );
  }, [handleLoadMore, searchParams]);

  return (
    <div className="min-h-screen bg-black">
      <NavigationBar />
      <div className="container py-8">
        <Header />
        <SearchFormContainer 
          onResults={setResults}
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
        />
      </div>
    </div>
  );
};

export default Index;
