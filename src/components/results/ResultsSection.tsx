
import React from 'react';
import Results from '../Results';
import { Result } from '@/components/ResultsTable';

interface ResultsSectionProps {
  results: Result[];
  onExport: () => void;
  onNewSearch: () => void;
  onResultUpdate: (result: Result) => void;
  hasMore: boolean;
  onLoadMore: (page: number) => void;
  isLoadingMore: boolean;
  isProcessing: boolean;
  searchPerformed: boolean;
}

const ResultsSection = ({
  results,
  onExport,
  onNewSearch,
  onResultUpdate,
  hasMore,
  onLoadMore,
  isLoadingMore,
  isProcessing,
  searchPerformed
}: ResultsSectionProps) => {
  if (!searchPerformed) return null;

  return (
    <Results 
      results={results}
      onExport={onExport} 
      onNewSearch={onNewSearch}
      onResultUpdate={onResultUpdate}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      isLoadingMore={isLoadingMore}
      isAnalyzing={isProcessing}
    />
  );
};

export default ResultsSection;
