
import React from 'react';
import ResultsTable, { Result } from './ResultsTable';
import ResultsHeader from './results/ResultsHeader';
import ResultsFilters from './results/ResultsFilters';
import EmptyResults from './results/EmptyResults';
import LoadMoreButton from './LoadMoreButton';
import ResultsPagination from './results/ResultsPagination';
import ResultsAnalyzingState from './results/ResultsAnalyzingState';
import useResultsContainer from '@/hooks/useResultsContainer';

interface ResultsProps {
  results?: Result[];
  onExport: () => void;
  onNewSearch: () => void;
  hasMore?: boolean;
  onLoadMore?: (page: number) => void;
  isLoadingMore?: boolean;
  isAnalyzing?: boolean;
  onResultUpdate?: (updatedResult: Result) => void;
}

const Results = ({ 
  results = [], 
  onExport, 
  onNewSearch, 
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  isAnalyzing = false,
  onResultUpdate
}: ResultsProps) => {
  console.log("Results component received:", { 
    resultsCount: results?.length, 
    isAnalyzing,
    hasResults: results && results.length > 0
  });
  
  const {
    validResults,
    displayedResults,
    filterValue,
    sortValue,
    currentPage,
    totalPages,
    chatbotCount,
    handleFilter,
    handleSort,
    handlePageChange
  } = useResultsContainer(results);

  // If we're currently analyzing and there are no valid results yet, show the analyzing state
  if (isAnalyzing && !validResults.length) {
    return <ResultsAnalyzingState />;
  }

  // If there are no valid results after filtering out errors and we're not analyzing
  if (!isAnalyzing && (!validResults || validResults.length === 0)) {
    return <EmptyResults onNewSearch={onNewSearch} />;
  }

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
          results={validResults}
          totalCount={validResults.length}
          chatbotCount={chatbotCount}
          onNewSearch={onNewSearch}
          onExport={onExport}
        />
      </div>
      <div className="rounded-[1.25rem] overflow-hidden bg-black/20 border border-white/10">
        <ResultsTable 
          results={displayedResults} 
          onResultUpdate={onResultUpdate}
        />
      </div>
      
      {totalPages > 1 && (
        <ResultsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            handlePageChange(page);
            if (onLoadMore && page > Math.ceil(validResults.length / 25)) {
              onLoadMore(page);
            }
          }}
        />
      )}
      
      {hasMore && onLoadMore && (
        <LoadMoreButton 
          onLoadMore={() => onLoadMore(currentPage + 1)} 
          isProcessing={isLoadingMore || isAnalyzing} 
        />
      )}
    </div>
  );
};

export default Results;
