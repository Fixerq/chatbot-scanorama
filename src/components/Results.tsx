import React, { useState } from 'react';
import ResultsTable, { Result } from './ResultsTable';
import ResultsHeader from './results/ResultsHeader';
import ResultsFilters from './results/ResultsFilters';
import EmptyResults from './results/EmptyResults';
import LoadMoreButton from './LoadMoreButton';
import { Button } from "./ui/button";
import { Play } from "lucide-react";
import { useToast } from "./ui/use-toast";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { createAnalysisRequest, invokeAnalysisFunction } from '@/services/analysisService';

interface ResultsProps {
  results?: Result[];
  onExport: () => void;
  onNewSearch: () => void;
  hasMore?: boolean;
  onLoadMore?: (currentPage: number) => void;
  isLoadingMore?: boolean;
  currentPage?: number;
}

const Results = ({ 
  results = [], 
  onExport, 
  onNewSearch, 
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  currentPage = 1
}: ResultsProps) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localPage, setLocalPage] = useState(currentPage);
  const [filteredResults, setFilteredResults] = useState<Result[]>(results.filter(r => 
    !r.status?.toLowerCase().includes('error analyzing url')
  ));
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('name');

  React.useEffect(() => {
    const newValidResults = results.filter(r => 
      !r.status?.toLowerCase().includes('error analyzing url')
    );
    setFilteredResults(newValidResults);
    setLocalPage(1);
  }, [results]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    let filtered = [...filteredResults];
    
    if (value === 'chatbot') {
      filtered = filtered.filter(r => r.details?.chatSolutions?.length > 0);
    } else if (value === 'no-chatbot') {
      filtered = filtered.filter(r => !r.details?.chatSolutions?.length);
    }
    
    setFilteredResults(filtered);
    setLocalPage(1);
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
    setLocalPage(page);
    if (onLoadMore) {
      onLoadMore(page);
    }
  };

  const analyzeAll = async () => {
    setIsAnalyzing(true);
    let errorCount = 0;

    try {
      await Promise.all(filteredResults.map(async (result) => {
        try {
          const request = await createAnalysisRequest(result.url);
          await invokeAnalysisFunction(result.url, request.id);
        } catch (error) {
          console.error(`Error analyzing ${result.url}:`, error);
          errorCount++;
        }
      }));

      if (errorCount > 0) {
        toast({
          title: "Warning",
          description: `Analysis completed with ${errorCount} errors`,
          variant: "destructive",
          duration: 3000,
        });
      } else {
        toast({
          title: "Success",
          description: "All websites queued for analysis",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Bulk analysis error:', error);
      toast({
        title: "Error",
        description: "Failed to start bulk analysis",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeResult = async (url: string) => {
    try {
      const request = await createAnalysisRequest(url);
      await invokeAnalysisFunction(url, request.id);
      toast({
        title: "Success",
        description: "Website queued for analysis",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error analyzing website:', error);
      toast({
        title: "Error",
        description: "Failed to analyze website",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  if (!results || results.length === 0) {
    return <EmptyResults onNewSearch={onNewSearch} />;
  }

  const chatbotCount = results.filter(r => r.details?.chatSolutions?.length > 0).length;
  const noChatbotCount = results.filter(r => !r.details?.chatSolutions?.length).length;
  
  const totalPages = Math.ceil(filteredResults.length / 50);
  const startIndex = (localPage - 1) * 50;
  const endIndex = startIndex + 50;
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
        <div className="flex items-center gap-4">
          <Button
            onClick={analyzeAll}
            disabled={isAnalyzing || filteredResults.length === 0}
            className="bg-black hover:bg-gray-800 text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            Analyze All
          </Button>
          <ResultsHeader
            results={results}
            totalCount={results.length}
            chatbotCount={chatbotCount}
            onNewSearch={onNewSearch}
            onExport={onExport}
          />
        </div>
      </div>
      <div className="rounded-[1.25rem] overflow-hidden bg-black/20 border border-white/10">
        <ResultsTable 
          results={displayedResults}
          onAnalyzeResult={analyzeResult}
          isAnalyzing={isAnalyzing}
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
    </div>
  );
};

export default Results;
