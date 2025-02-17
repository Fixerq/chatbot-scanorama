
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { formatUrl } from '@/utils/urlFormatting';
import ResultStatusCell from './ResultStatusCell';
import { Result } from '../ResultsTable';
import { AnalysisResult } from '@/utils/types/search';

interface TableRowProps {
  result: Result;
  onResultUpdate?: (updatedResult: Result) => void;
  onRetry?: (url: string) => void;
}

const ResultTableRow = ({ result, onResultUpdate, onRetry }: TableRowProps) => {
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

  const { displayUrl } = formatUrl(result.url);
  const status = getStatus(result);
  const error = getErrorMessage(result);

  return (
    <TableRow className={error ? 'bg-red-50/10' : ''}>
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
        onAnalysisUpdate={(newAnalysis: AnalysisResult) => {
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
};

export default ResultTableRow;

