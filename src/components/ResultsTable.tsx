
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
  error?: string;
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
    console.log('ResultsTable mount/update:', {
      resultsLength: results?.length,
      isProcessing: processing,
      isLoading,
      hasUpdateHandler: !!onResultUpdate,
      hasRetryHandler: !!onRetry,
      firstResult: results?.[0]
    });
  }, [results, processing, isLoading, onResultUpdate, onRetry]);

  if (isLoading || processing) {
    console.log('ResultsTable showing loading state');
    return <TableLoadingState />;
  }

  if (!results?.length) {
    console.log('ResultsTable showing empty state');
    return <TableEmptyState />;
  }

  console.log('ResultsTable rendering results table with data:', {
    resultsCount: results.length,
    columns: ['Status', 'Title', 'URL', 'Analysis', 'Actions'],
    sampleResult: results[0]
  });

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
              <TableHead>Analysis</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, i) => (
              <ResultTableRow
                key={i}
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

