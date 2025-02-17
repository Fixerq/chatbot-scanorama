
import React, { ReactNode } from 'react';
import { Result } from '../ResultsTable';
import ResultsHeader from './ResultsHeader';
import ResultsFilters from './ResultsFilters';
import { useResultsState } from '@/hooks/useResultsState';

interface ResultsContainerProps {
  results: Result[];
  onExport: () => void;
  onNewSearch: () => void;
  hasMore?: boolean;
  onLoadMore?: (currentPage: number) => void;
  isLoadingMore?: boolean;
  isAnalyzing?: boolean;
  children: ReactNode;
}

const ResultsContainer = ({
  results,
  onExport,
  onNewSearch,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  isAnalyzing = false,
  children
}: ResultsContainerProps) => {
  const {
    filteredResults,
    filterValue,
    sortValue,
    handleFilter,
    handleSort,
  } = useResultsState(results);

  console.log('ResultsContainer: Received results:', results.length);
  console.log('ResultsContainer: Filtered results:', filteredResults.length);
  console.log('ResultsContainer: isAnalyzing:', isAnalyzing);

  return (
    <div className="mt-12 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <ResultsFilters
          filterValue={filterValue}
          sortValue={sortValue}
          onFilterChange={handleFilter}
          onSortChange={handleSort}
        />
        <ResultsHeader
          results={filteredResults}
          totalCount={filteredResults.length}
          chatbotCount={filteredResults.filter(r => r.analysis_result?.has_chatbot).length}
          onNewSearch={onNewSearch}
          onExport={onExport}
        />
      </div>
      {React.cloneElement(children as React.ReactElement, { 
        results: filteredResults,
        isAnalyzing,
        isLoadingMore 
      })}
    </div>
  );
};

export default ResultsContainer;
