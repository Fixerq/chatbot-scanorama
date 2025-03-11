
import React from 'react';
import DashboardContainer from '@/components/layout/DashboardContainer';
import SearchSection from '@/components/search/SearchSection';
import ResultsSection from '@/components/results/ResultsSection';
import { useIndexState } from '@/hooks/useIndexState';

const Index = () => {
  const {
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
  } = useIndexState();

  return (
    <DashboardContainer>
      <SearchSection
        onResults={(newResults, hasMoreResults) => handleSetResults(newResults, hasMoreResults)}
        onPartialResults={handlePartialResults}
        onHasMoreChange={handleSetMoreInfo}
        isProcessing={isProcessing}
        setIsProcessing={handleSetProcessing}
        triggerNewSearch={newSearchTrigger}
      />
      
      <ResultsSection
        results={results}
        onExport={() => {}}
        onNewSearch={handleNewSearch}
        onResultUpdate={result => {
          console.log('Result update received:', result.url);
          handlePartialResults([result]);
        }}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoadingMore}
        isProcessing={isProcessing}
        searchPerformed={searchPerformed}
      />
    </DashboardContainer>
  );
};

export default Index;
