
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

  const handleNewSearch = useCallback(() => {
    setResults([]);
    setNewSearchTrigger(prev => !prev);
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
    console.log('Results updated:', results);
  }, [results]);

  return (
    <div className="min-h-screen bg-black">
      <NavigationBar />
      <div className="container py-8">
        <Header />
        <div className="mb-4">
          <UserStatusCheck />
        </div>
        <SearchFormContainer 
          onResults={setResults}
          isProcessing={isProcessing}
          triggerNewSearch={newSearchTrigger}
        />
        <Results 
          results={results}
          onExport={() => {}} 
          onNewSearch={handleNewSearch}
          onResultUpdate={handleResultUpdate}
          hasMore={false}
          isAnalyzing={isProcessing}
        />
      </div>
    </div>
  );
};

export default Index;
