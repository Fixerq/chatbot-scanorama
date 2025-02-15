
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
    handleSort
  } = useResultsState(results);

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
          results={results}
          totalCount={results.length}
          chatbotCount={0}
          onNewSearch={onNewSearch}
          onExport={onExport}
        />
      </div>
      {children}
    </div>
  );
};

export default ResultsContainer;
