
import React from 'react';
import ResultsHeader from './results/ResultsHeader';
import ResultsFilters from './results/ResultsFilters';
import ResultsContent from './results/ResultsContent';
import ResultsContainer from './results/ResultsContainer';
import ResultsTable, { Result } from './ResultsTable';
import EmptyResults from './results/EmptyResults';

interface ResultsProps {
  results: Result[];
  onExport: () => void;
  onNewSearch: () => void;
  hasMore: boolean;
  onLoadMore: (page: number) => void;
  isLoadingMore?: boolean;
  onResultUpdate?: (updatedResult: Result) => void;
}

const Results: React.FC<ResultsProps> = ({ 
  results, 
  onExport, 
  onNewSearch, 
  hasMore, 
  onLoadMore,
  isLoadingMore,
  onResultUpdate
}) => {
  const hasResults = results.length > 0;

  return (
    <ResultsContainer>
      {hasResults ? (
        <>
          <ResultsHeader onExport={onExport} onNewSearch={onNewSearch} />
          <ResultsFilters />
          <ResultsContent>
            <ResultsTable 
              results={results} 
              isLoading={isLoadingMore}
              onResultUpdate={onResultUpdate}
            />
          </ResultsContent>
        </>
      ) : (
        <EmptyResults onNewSearch={onNewSearch} />
      )}
    </ResultsContainer>
  );
};

export default Results;
