
import React from 'react';
import { Result } from './ResultsTable';
import ResultsContainer from './results/ResultsContainer';
import EmptyResults from './results/EmptyResults';

interface ResultsProps {
  results?: Result[];
  onExport: () => void;
  onNewSearch: () => void;
  hasMore?: boolean;
  onLoadMore?: (currentPage: number) => void;
  isLoadingMore?: boolean;
  currentPage?: number;
}

const Results = ({ 
  results = [], 
  onExport, 
  onNewSearch, 
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  currentPage = 1
}: ResultsProps) => {
  if (!results || results.length === 0) {
    return <EmptyResults onNewSearch={onNewSearch} />;
  }

  return (
    <ResultsContainer
      results={results}
      onExport={onExport}
      onNewSearch={onNewSearch}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      isLoadingMore={isLoadingMore}
      currentPage={currentPage}
    />
  );
};

export default Results;
