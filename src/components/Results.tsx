import React, { useState } from 'react';
import ResultsTable, { Result } from './ResultsTable';
import ResultsHeader from './results/ResultsHeader';
import ResultsFilters from './results/ResultsFilters';
import EmptyResults from './results/EmptyResults';
import LoadMoreButton from './LoadMoreButton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ResultsProps {
  results?: Result[];
  onExport: () => void;
  onNewSearch: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

const Results = ({ 
  results = [], 
  onExport, 
  onNewSearch, 
  hasMore = false,
  onLoadMore,
  isLoadingMore = false
}: ResultsProps) => {
  // Filter out only results with error status
  const validResults = results.filter(r => 
    !r.status?.toLowerCase().includes('error analyzing url')
  );
  const [filteredResults, setFilteredResults] = useState<Result[]>(validResults);
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 50; // Increased from 25 to 50

  React.useEffect(() => {
    // Filter out error results whenever the results prop changes
    const newValidResults = results.filter(r => 
      !r.status?.toLowerCase().includes('error analyzing url')
    );
    setFilteredResults(newValidResults);
    setCurrentPage(1); // Reset to first page when results change
  }, [results]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    let filtered = [...validResults];
    
    if (value === 'chatbot') {
      filtered = filtered.filter(r => r.details?.chatSolutions?.length > 0);
    } else if (value === 'no-chatbot') {
      filtered = filtered.filter(r => !r.details?.chatSolutions?.length);
    }
    
    setFilteredResults(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSort = (value: string) => {
    setSortValue(value);
    let sorted = [...filteredResults];
    
    switch (value) {
      case 'name':
        sorted.sort((a, b) => {
          const nameA = a.details?.business_name || '';
          const nameB = b.details?.business_name || '';
          return nameA.localeCompare(nameB);
        });
        break;
      case 'url':
        sorted.sort((a, b) => a.url.localeCompare(b.url));
        break;
      case 'status':
        sorted.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
        break;
    }
    
    setFilteredResults(sorted);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!validResults || validResults.length === 0) {
    return <EmptyResults onNewSearch={onNewSearch} />;
  }

  const chatbotCount = validResults.filter(r => r.details?.chatSolutions?.length > 0).length;
  const noChatbotCount = validResults.filter(r => !r.details?.chatSolutions?.length).length;
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const displayedResults = filteredResults.slice(startIndex, endIndex);

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
        <ResultsTable results={displayedResults} />
      </div>
      
      {hasMore && (
        <LoadMoreButton 
          onLoadMore={onLoadMore || (() => {})}
          isProcessing={isLoadingMore}
        />
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, and pages around current page
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default Results;
