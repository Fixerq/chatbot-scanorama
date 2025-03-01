
import React, { useState, useCallback, useEffect } from 'react';
import NavigationBar from '@/components/NavigationBar';
import Header from '@/components/Header';
import SearchFormContainer from '@/components/SearchFormContainer';
import Results from '@/components/Results';
import { Result } from '@/components/ResultsTable';
import { UserStatusCheck } from '@/components/UserStatusCheck';
import { toast } from 'sonner';

const Index = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newSearchTrigger, setNewSearchTrigger] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleNewSearch = useCallback(() => {
    setResults([]);
    setNewSearchTrigger(prev => !prev);
    setSearchPerformed(false);
    console.log('New search triggered');
  }, []);

  const handleResultUpdate = (updatedResult: Result) => {
    console.log('Triggering result update for:', updatedResult);
    
    // Find the result and reanalyze it
    setResults(prev => prev.map(result => 
      result.url === updatedResult.url ? 
        { ...result, status: 'Processing...' } : 
        result
    ));
    
    // Here you would call your analysis function again
    // For now, let's just update the status after a delay to simulate
    setTimeout(() => {
      setResults(prev => prev.map(result => 
        result.url === updatedResult.url ? 
          { ...result, status: 'Analyzed' } : 
          result
      ));
      toast.success('Analysis refreshed');
    }, 1500);
  };

  // Debug log when results change
  useEffect(() => {
    console.log('Results updated in Index component:', { 
      count: results.length, 
      hasResults: results.length > 0,
      isProcessing
    });
  }, [results, isProcessing]);

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

  return (
    <div className="min-h-screen bg-black">
      <NavigationBar />
      <div className="container py-8">
        <Header />
        <div className="mb-4">
          <UserStatusCheck />
        </div>
        <SearchFormContainer 
          onResults={handleSetResults}
          onHasMoreChange={handleSetMoreInfo}
          isProcessing={isProcessing}
          setIsProcessing={handleSetProcessing}
          triggerNewSearch={newSearchTrigger}
        />
        {/* Only show Results component when a search has been performed */}
        {searchPerformed && (
          <Results 
            results={results}
            onExport={() => {}} 
            onNewSearch={handleNewSearch}
            onResultUpdate={handleResultUpdate}
            hasMore={hasMore}
            isAnalyzing={isProcessing}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
