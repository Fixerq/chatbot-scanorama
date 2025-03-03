
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
    hasResults: results && results.length > 0,
    hasMore // Log hasMore flag to verify its value
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

  // Debug log for validResults
  console.log("Valid results count:", validResults?.length);
  console.log("hasMore status:", hasMore);

  // Show analyzing state when we're analyzing and either:
  // 1. There are no results at all, or
  // 2. We have results but they're still being processed
  if (isAnalyzing && (results.length === 0 || results.every(r => r.status === 'Processing...'))) {
    return <ResultsAnalyzingState />;
  }

  // If there are no valid results after filtering and we're not analyzing
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
          onPageChange={handlePageChange}
          hasMoreResults={hasMore}
          onLoadMore={onLoadMore}
          isLoading={isLoadingMore}
        />
      )}
      
      {/* Always show Load More button if hasMore is true */}
      {hasMore && onLoadMore && (
        <div className="mt-6 flex justify-center">
          <LoadMoreButton 
            onLoadMore={() => onLoadMore(currentPage + 1)} 
            isProcessing={isLoadingMore || isAnalyzing} 
          />
        </div>
      )}
    </div>
  );
};

export default Results;
