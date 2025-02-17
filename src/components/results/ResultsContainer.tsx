
import React, { ReactNode } from 'react';
import { Result } from '../ResultsTable';
import ResultsHeader from './ResultsHeader';
import ResultsFilters from './ResultsFilters';
import ResultsContent from './ResultsContent';
import { useResultsState } from '@/hooks/useResultsState';

interface ResultsContainerProps {
  results: Result[];
  onExport: () => void;
  onNewSearch: () => void;
  hasMore?: boolean;
  onLoadMore?: (currentPage: number) => void;
  isLoadingMore?: boolean;
  currentPage?: number;
  children: ReactNode;
}

const ResultsContainer = ({
  results,
  onExport,
  onNewSearch,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  currentPage = 1,
  children
}: ResultsContainerProps) => {
  const {
    filteredResults,
    filterValue,
    sortValue,
    localPage,
    setLocalPage,
    handleFilter,
    handleSort,
    isLoading
  } = useResultsState(results);

  console.log('ResultsContainer: Received results:', results.length);
  console.log('ResultsContainer: Filtered results:', filteredResults.length);

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
      {React.cloneElement(children as React.ReactElement, { results: filteredResults })}
    </div>
  );
};

export default ResultsContainer;

