
import React from 'react';
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

interface ResultsContentProps {
  results: Result[];
  localPage: number;
  setLocalPage: (page: number) => void;
  hasMore?: boolean;
  onLoadMore?: (currentPage: number) => void;
  isLoadingMore?: boolean;
}

const ResultsContent = ({
  results,
  localPage,
  setLocalPage,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false
}: ResultsContentProps) => {
  // Filter out results that haven't been analyzed yet
  const analyzedResults = results.filter(r => {
    const hasStatus = r.status && r.status.toLowerCase() === 'success';
    const hasAnalysisResult = r.details?.chatSolutions || r.chatbot_solutions;
    return hasStatus || hasAnalysisResult;
  });

  if (!analyzedResults || analyzedResults.length === 0) {
    return (
      <EmptyResults 
        onNewSearch={() => {}} 
        message="No analyzed results found. Please wait while websites are being analyzed."
      />
    );
  }

  const handlePageChange = (page: number) => {
    setLocalPage(page);
    if (onLoadMore) {
      onLoadMore(page);
    }
  };

  const totalPages = Math.ceil(analyzedResults.length / 50);
  const startIndex = (localPage - 1) * 50;
  const endIndex = startIndex + 50;
  const displayedResults = analyzedResults.slice(startIndex, endIndex);

  return (
    <>
      <div className="rounded-[1.25rem] overflow-hidden bg-black/20 border border-white/10">
        <ResultsTable 
          results={displayedResults}
        />
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
