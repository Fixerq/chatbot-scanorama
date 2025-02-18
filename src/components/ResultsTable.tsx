
import React, { useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AnalysisResult } from '@/utils/types/search';
import TableWrapper from './TableWrapper';
import TableLoadingState from './results/TableLoadingState';
import TableEmptyState from './results/TableEmptyState';
import ResultTableRow from './results/TableRow';

export interface Result {
  url: string;
  title?: string;
  description?: string;
  business_name?: string;
  website_url?: string;
  address?: string;
  placeId?: string;
  businessType?: string;
  error?: string | null;
  status?: string;
  details?: {
    search_batch_id: string;
    business_name?: string;
    title?: string;
    description?: string;
    address?: string;
    website_url?: string;
    error?: string;
    [key: string]: any;
  };
  analysis_result?: AnalysisResult;
}

interface ResultsTableProps {
  results: Result[];
  processing?: boolean;
  isLoading?: boolean;
  onResultUpdate?: (updatedResult: Result) => void;
  onRetry?: (url: string) => void;
}

const ResultsTable = ({ 
  results, 
  processing, 
  isLoading, 
  onResultUpdate,
  onRetry 
}: ResultsTableProps) => {
  useEffect(() => {
    console.log('ResultsTable render:', {
      resultsCount: results?.length,
      firstResult: results?.[0],
      isProcessing: processing,
      isLoading
    });
  }, [results, processing, isLoading]);

  if (isLoading || processing) {
    return <TableLoadingState />;
  }

  if (!results?.length) {
    return <TableEmptyState />;
  }

  return (
    <div className="w-full overflow-x-auto">
      <TableWrapper>
        <Table>
          <TableCaption className="text-muted-foreground">
            Search results and analysis status.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="min-w-[200px]">Analysis</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, i) => (
              <ResultTableRow
                key={`${result.url}-${i}`}
                result={result}
                onResultUpdate={onResultUpdate}
                onRetry={onRetry}
              />
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  );
};

export default ResultsTable;
