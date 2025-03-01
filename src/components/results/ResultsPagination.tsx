
import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ResultsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasMoreResults?: boolean;
  onLoadMore?: (page: number) => void;
}

const ResultsPagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  hasMoreResults,
  onLoadMore
}: ResultsPaginationProps) => {
  const handlePageChange = (page: number) => {
    // First, notify the parent component of the page change
    onPageChange(page);
    
    // If we're trying to go to a page that would need more results to be loaded
    const resultsPerPage = 25; // Standard page size
    const neededResults = page * resultsPerPage;
    
    // If we need to load more results and the onLoadMore function exists
    if (hasMoreResults && onLoadMore && page > currentPage) {
      console.log(`Loading more results for page ${page}`);
      onLoadMore(page);
    }
  };

  const renderPageLinks = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if there are fewer than maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      if (currentPage > 3) {
        pageNumbers.push(null); // Ellipsis
      }
      
      // Pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pageNumbers.push(null); // Ellipsis
      }
      
      // Always show last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers.map((page, index) => {
      if (page === null) {
        return (
          <PaginationItem key={`ellipsis-${index}`}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      return (
        <PaginationItem key={page}>
          <PaginationLink
            onClick={() => handlePageChange(page as number)}
            isActive={currentPage === page}
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      );
    });
  };

  return (
    <Pagination className="justify-center">
      <PaginationContent>
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
          </PaginationItem>
        )}
        
        {renderPageLinks()}
        
        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
};

export default ResultsPagination;
