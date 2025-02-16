
import React, { ReactNode } from 'react';
import { Result } from '../ResultsTable';
import ResultsTable from '../ResultsTable';
import EmptyResults from './EmptyResults';
import LoadMoreButton from '../LoadMoreButton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader2 } from 'lucide-react';

interface ResultsContentProps {
  results: Result[];
  localPage: number;
  setLocalPage: (page: number) => void;
  hasMore?: boolean;
  onLoadMore?: (currentPage: number) => void;
  isLoadingMore?: boolean;
  isAnalyzing?: boolean;
  children: ReactNode;
}

const ResultsContent = ({
  results,
  localPage,
  setLocalPage,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  isAnalyzing = false,
  children
}: ResultsContentProps) => {
  const validResults = results.filter(r => {
    const hasValidStatus = r.status !== undefined;
    const hasDetails = Boolean(r.details);
    return hasValidStatus || hasDetails;
  });

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Analyzing websites...</p>
        <p className="text-sm text-muted-foreground">This may take a few moments</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <EmptyResults 
        onNewSearch={() => {}} 
        message="No results found. Please try searching for businesses to analyze."
      />
    );
  }

  const handlePageChange = (page: number) => {
    setLocalPage(page);
    if (onLoadMore) {
      onLoadMore(page);
    }
  };

  const totalPages = Math.ceil(validResults.length / 50);
  const startIndex = (localPage - 1) * 50;
  const endIndex = startIndex + 50;
  const displayedResults = validResults.slice(startIndex, endIndex);

  return (
    <>
      <div className="rounded-[1.25rem] overflow-hidden bg-black/20 border border-white/10">
        {children}
      </div>
      
      {hasMore && (
        <LoadMoreButton 
          onLoadMore={() => onLoadMore?.(localPage + 1)}
          isProcessing={isLoadingMore}
        />
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(localPage - 1)}
                  className={localPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= localPage - 1 && page <= localPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={localPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  page === localPage - 2 ||
                  page === localPage + 2
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
                  onClick={() => handlePageChange(localPage + 1)}
                  className={localPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
};

export default ResultsContent;
