
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
import { toast } from 'sonner';

interface ResultsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasMoreResults?: boolean;
  onLoadMore?: (page: number) => void;
  isLoading?: boolean; // Add loading state
}

const ResultsPagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  hasMoreResults,
  onLoadMore,
  isLoading = false
}: ResultsPaginationProps) => {
  const handlePageChange = (page: number) => {
    if (page === currentPage || isLoading) return;
    
    const isForwardNavigation = page > currentPage;
    
    // Check if we need to load more results for forward navigation
    if (isForwardNavigation && hasMoreResults && onLoadMore && page > Math.ceil(totalPages * 0.75)) {
      console.log(`Loading more results for future pages (${page})`);
      // Load more results before changing the page to ensure they're available
      try {
        onLoadMore(page);
        toast.info("Loading additional results for pagination...");
      } catch (error) {
        console.error('Error triggering load more:', error);
        toast.error('Failed to load additional results');
      }
    }
    
    // Always notify the parent component of the page change
    onPageChange(page);
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
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
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
            className={`${currentPage === page ? "pointer-events-none" : ""} ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
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
            <PaginationPrevious 
              onClick={() => handlePageChange(currentPage - 1)} 
              className={isLoading ? "opacity-50 pointer-events-none" : ""}
            />
          </PaginationItem>
        )}
        
        {renderPageLinks()}
        
        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext 
              onClick={() => handlePageChange(currentPage + 1)} 
              className={isLoading ? "opacity-50 pointer-events-none" : ""}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
};

export default ResultsPagination;
