
import React, { useState, useCallback } from 'react';
import NavigationBar from '@/components/NavigationBar';
import Header from '@/components/Header';
import SearchFormContainer from '@/components/SearchFormContainer';
import Results from '@/components/Results';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';

const Index = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newSearchTrigger, setNewSearchTrigger] = useState(false);

  const handleNewSearch = useCallback(() => {
    setResults([]);
    setNewSearchTrigger(prev => !prev);
  }, []);

  const handleSearchError = useCallback((error: Error) => {
    console.error('Search error:', error);
    toast.error('An error occurred during search. Please try again.');
  }, []);

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
        />
        <Results 
          results={results}
          onExport={() => {}} 
          onNewSearch={handleNewSearch}
        />
      </div>
    </div>
  );
};

export default Index;
