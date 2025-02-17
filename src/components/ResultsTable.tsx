
import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatUrl } from '@/utils/urlFormatting';
import ResultStatusCell from './results/ResultStatusCell';
import { AnalysisResult } from '@/utils/types/search';
import { Button } from './ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "./ui/alert";

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
  const getErrorMessage = (result: Result): string | null => {
    return result.error || 
           result.details?.error || 
           result.analysis_result?.error || 
           null;
  };

  const getStatus = (result: Result): string => {
    const error = getErrorMessage(result);
    if (error) return 'error';
    if (result.status === 'analyzing') return 'analyzing';
    return result.status || 'pending';
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'error':
        return 'destructive';
      case 'analyzing':
        return 'secondary';
      case 'completed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (isLoading || processing) {
    return (
      <div className="w-full space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100/10 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!results.length) {
    return (
      <Alert>
        <AlertDescription>
          No results found. Start a new search to see results here.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableCaption className="text-muted-foreground">Search results and analysis status.</TableCaption>
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
          {results.map((result, i) => {
            const { displayUrl } = formatUrl(result.url);
            const status = getStatus(result);
            const error = getErrorMessage(result);
            
            return (
              <TableRow key={i} className={error ? 'bg-red-50/10' : ''}>
                <TableCell>
                  <Badge variant={getBadgeVariant(status)}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                  {error && (
                    <div className="mt-2 text-sm text-red-500 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {result.title || result.details?.title || 'Untitled'}
                </TableCell>
                <TableCell>
                  <a 
                    href={result.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-400 hover:text-blue-300 transition-colors underline-offset-4 hover:underline"
                  >
                    {displayUrl}
                  </a>
                </TableCell>
                <ResultStatusCell
                  status={status}
                  analysis_result={result.analysis_result}
                  isAnalyzing={status === 'analyzing'}
                  url={result.url}
                  onAnalysisUpdate={(newAnalysis) => {
                    if (onResultUpdate) {
                      onResultUpdate({
                        ...result,
                        analysis_result: newAnalysis,
                        status: newAnalysis.status,
                        error: newAnalysis.error
                      });
                    }
                  }}
                />
                <TableCell>
                  {error && onRetry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRetry(result.url)}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResultsTable;
