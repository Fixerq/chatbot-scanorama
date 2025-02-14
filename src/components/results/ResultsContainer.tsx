
import React from 'react';
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
}

const ResultsContainer = ({
  results,
  onExport,
  onNewSearch,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  currentPage = 1
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

  const chatbotCount = results.filter(r => r.details?.chatSolutions?.length > 0).length;

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
          chatbotCount={chatbotCount}
          onNewSearch={onNewSearch}
          onExport={onExport}
        />
      </div>
      <ResultsContent
        results={filteredResults}
        localPage={localPage}
        setLocalPage={setLocalPage}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        isLoadingMore={isLoadingMore}
      />
    </div>
  );
};

export default ResultsContainer;
