import React, { useState } from 'react';
import NavigationBar from '@/components/NavigationBar';
import Header from '@/components/Header';
import SearchFormContainer from '@/components/SearchFormContainer';
import Results from '@/components/Results';
import { Result } from '@/components/ResultsTable';
import { UserStatusCheck } from '@/components/UserStatusCheck';

const Index = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = () => {
    // Export functionality will be implemented later
    console.log('Export clicked');
  };

  const handleNewSearch = () => {
    setResults([]);
  };

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
        />
        <Results 
          results={results}
          onExport={handleExport}
          onNewSearch={handleNewSearch}
        />
      </div>
    </div>
  );
};

export default Index;