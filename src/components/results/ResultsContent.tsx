
import React, { ReactNode } from 'react';
import { Result } from '../ResultsTable';
import LoadMoreButton from '../LoadMoreButton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink
} from "@/components/ui/pagination";
import { Loader2 } from 'lucide-react';

interface ResultsContentProps {
  results: Result[];
  hasMore?: boolean;
  onLoadMore?: (currentPage: number) => void;
  isLoadingMore?: boolean;
  isAnalyzing?: boolean;
  children: ReactNode;
}

const ResultsContent = ({
  results,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  isAnalyzing = false,
  children
}: ResultsContentProps) => {
  // More permissive validation that accepts results with any meaningful data
  const validResults = results.filter(r => {
    const hasData = r.url && (
      r.status !== undefined || 
      r.details || 
      r.title || 
      r.business_name
    );
    console.log('Validating result:', {
      url: r.url,
      hasStatus: r.status !== undefined,
      hasDetails: !!r.details,
      hasTitle: !!r.title,
      hasBusinessName: !!r.business_name,
      isValid: hasData
    });
    return hasData;
  });

  console.log('ResultsContent filtered results:', {
    totalResults: results.length,
    validResults: validResults.length
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
    return null;
  }

  const totalPages = Math.ceil(validResults.length / 50);
  const currentPage = Math.ceil(validResults.length / 50);

  return (
    <>
      <div className="rounded-[1.25rem] overflow-hidden bg-black/20 border border-white/10">
        {children}
      </div>
      
      {hasMore && (
        <LoadMoreButton 
          onLoadMore={() => onLoadMore?.(currentPage + 1)}
          isProcessing={isLoadingMore}
        />
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => onLoadMore?.(page)}
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
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
};

export default ResultsContent;

