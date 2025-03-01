
import React, { useState, useEffect } from 'react';
import ResultsTable, { Result } from './ResultsTable';
import ResultsHeader from './results/ResultsHeader';
import ResultsFilters from './results/ResultsFilters';
import EmptyResults from './results/EmptyResults';
import LoadMoreButton from './LoadMoreButton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";

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
    isAnalyzing 
  });
  
  // Filter out only results with error status
  const validResults = results?.filter(r => 
    r && !r.status?.toLowerCase().includes('error analyzing url')
  ) || [];
  
  const [filteredResults, setFilteredResults] = useState<Result[]>(validResults);
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 25;

  // Update filtered results when the input results change
  useEffect(() => {
    console.log('Processing results:', validResults);
    setFilteredResults(validResults);
    setCurrentPage(1); // Reset to first page when results change
  }, [validResults]);

  // Apply filters when filter value changes
  useEffect(() => {
    let filtered = [...validResults];
    
    if (filterValue === 'chatbot') {
      filtered = filtered.filter(r => r.details?.chatSolutions?.length > 0);
    } else if (filterValue === 'no-chatbot') {
      filtered = filtered.filter(r => !r.details?.chatSolutions?.length);
    }
    
    setFilteredResults(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [filterValue, validResults]);

  const handleFilter = (value: string) => {
    console.log('Applying filter:', value);
    setFilterValue(value);
  };

  const handleSort = (value: string) => {
    console.log('Applying sort:', value);
    setSortValue(value);
    let sorted = [...filteredResults];
    
    switch (value) {
      case 'name':
        sorted.sort((a, b) => (a.details?.title || '').localeCompare(b.details?.title || ''));
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
    if (onLoadMore && page > Math.ceil(filteredResults.length / resultsPerPage)) {
      onLoadMore(page);
    }
  };

  // If we're currently analyzing or there are no results yet
  if (isAnalyzing && validResults.length === 0) {
    return (
      <div className="mt-12 p-8 rounded-[1.25rem] overflow-hidden bg-black/20 border border-white/10 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-cyan-500/20 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-cyan-500/20 rounded w-1/2 mx-auto"></div>
          <div className="h-4 bg-cyan-500/20 rounded w-5/6 mx-auto"></div>
        </div>
        <p className="text-cyan-100 mt-4">Searching and analyzing websites...</p>
      </div>
    );
  }

  // If there are no valid results after filtering out errors
  if (!validResults || validResults.length === 0) {
    return <EmptyResults onNewSearch={onNewSearch} />;
  }

  const chatbotCount = validResults.filter(r => r.details?.chatSolutions?.length > 0).length;
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = Math.min(startIndex + resultsPerPage, filteredResults.length);
  const displayedResults = filteredResults.slice(startIndex, endIndex);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPageButtons = 5;
    
    if (totalPages <= maxPageButtons) {
      // Show all pages if there are fewer than maxPageButtons
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate range of pages to show around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're at the beginning or end
      if (currentPage <= 2) {
        endPage = Math.min(4, totalPages - 1);
      } else if (currentPage >= totalPages - 1) {
        startPage = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

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
        <Pagination className="my-6">
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage - 1);
                  }}
                />
              </PaginationItem>
            )}
            
            {getPageNumbers().map((page, index) => (
              typeof page === 'number' ? (
                <PaginationItem key={index}>
                  <PaginationLink 
                    href="#"
                    isActive={page === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(page);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={`${page}-${index}`}>
                  <span className="flex h-9 w-9 items-center justify-center text-sm">...</span>
                </PaginationItem>
              )
            ))}
            
            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage + 1);
                  }}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
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
