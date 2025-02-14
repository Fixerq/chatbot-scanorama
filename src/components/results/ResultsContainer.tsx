
import React, { useState } from 'react';
import { Result } from '../ResultsTable';
import ResultsHeader from './ResultsHeader';
import ResultsFilters from './ResultsFilters';
import ResultsContent from './ResultsContent';
import { useResultsState } from '@/hooks/useResultsState';
import { useToast } from "@/components/ui/use-toast";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createAnalysisRequest, invokeAnalysisFunction } from '@/services/analysisService';

interface ResultsContainerProps {
  results: Result[];
  onExport: () => void;
  onNewSearch: () => void;
  hasMore?: boolean;
  onLoadMore?: (currentPage: number) => void;
  isLoadingMore?: boolean;
  currentPage?: number;
}

const ResultsContainer = ({
  results,
  onExport,
  onNewSearch,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  currentPage = 1
}: ResultsContainerProps) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const {
    filteredResults,
    filterValue,
    sortValue,
    localPage,
    setLocalPage,
    handleFilter,
    handleSort
  } = useResultsState(results);

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

  const chatbotCount = results.filter(r => r.details?.chatSolutions?.length > 0).length;

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
      <ResultsContent
        results={filteredResults}
        localPage={localPage}
        setLocalPage={setLocalPage}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        isLoadingMore={isLoadingMore}
      />
    </div>
  );
};

export default ResultsContainer;
