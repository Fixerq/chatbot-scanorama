
import React, { useState, useEffect } from 'react';
import ResultsTable, { Result } from './ResultsTable';
import ResultsHeader from './results/ResultsHeader';
import ResultsFilters from './results/ResultsFilters';
import EmptyResults from './results/EmptyResults';
import LoadMoreButton from './LoadMoreButton';
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
    hasMore
  });
  
  const RESULTS_PER_PAGE = 10; // Show 10 per page instead of larger batches
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedResults, setDisplayedResults] = useState<Result[]>([]);
  
  const {
    validResults,
    filterValue,
    sortValue,
    chatbotCount,
    handleFilter,
    handleSort
  } = useResultsContainer(results);
  
  // Update displayed results when page or filtered results change
  useEffect(() => {
    if (validResults.length > 0) {
      // Slice the results array based on current page
      const startIndex = 0; // Always show from beginning
      const endIndex = Math.min(currentPage * RESULTS_PER_PAGE, validResults.length);
      setDisplayedResults(validResults.slice(startIndex, endIndex));
    } else {
      setDisplayedResults([]);
    }
  }, [validResults, currentPage, RESULTS_PER_PAGE]);
  
  // Handle loading more results
  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    
    // If we're close to the end of our local results and there are more on the server
    if (validResults.length <= nextPage * RESULTS_PER_PAGE + RESULTS_PER_PAGE && hasMore && onLoadMore) {
      onLoadMore(nextPage);
    }
  };
  
  // Debug log for validResults
  console.log("Valid results count:", validResults?.length);
  console.log("hasMore status:", hasMore);
  console.log("Displayed results:", displayedResults.length);

  // Check if we need to show full analyzing state
  const showFullAnalyzingState = isAnalyzing && results.length === 0;
  
  // Check if we need to show the empty results state
  const showEmptyResults = !isAnalyzing && (!validResults || validResults.length === 0);
  
  if (showEmptyResults) {
    return <EmptyResults onNewSearch={onNewSearch} />;
  }

  // Rather than showing an analyzing indicator for all results or nothing,
  // we'll show results as they come in with the analyzing state above them
  return (
    <div className="mt-12 space-y-6">
      {/* Always show analyzing state when still processing */}
      {isAnalyzing && (
        <div className="mb-4">
          <ResultsAnalyzingState isPartial={results.length > 0} />
        </div>
      )}
      
      {/* Show results table if we have any results */}
      {results.length > 0 && (
        <>
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
          
          {/* Show Load More button if there are more results to display */}
          {(validResults.length > currentPage * RESULTS_PER_PAGE || hasMore) && (
            <div className="mt-6 flex justify-center">
              <LoadMoreButton 
                onLoadMore={handleLoadMore} 
                isProcessing={isLoadingMore || isAnalyzing} 
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Results;
