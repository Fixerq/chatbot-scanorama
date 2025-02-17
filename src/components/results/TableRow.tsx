
import React from 'react';
import { TableRow } from "@/components/ui/table";
import { Result } from '../ResultsTable';
import ResultStatusCell from './ResultStatusCell';
import StatusBadgeCell from './cells/StatusBadgeCell';
import TitleCell from './cells/TitleCell';
import UrlCell from './cells/UrlCell';
import RetryCell from './cells/RetryCell';

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
    if (result.analysis_result?.status) return result.analysis_result.status;
    const error = getErrorMessage(result);
    if (error) return 'error';
    if (result.status === 'analyzing') return 'analyzing';
    return result.status || 'pending';
  };

  const error = getErrorMessage(result);
  const status = getStatus(result);

  return (
    <TableRow className={error ? 'bg-red-50/10' : ''}>
      <StatusBadgeCell status={status} error={error} />
      <TitleCell title={result.title || result.details?.title || 'Untitled'} />
      <UrlCell url={result.url} />
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
      <RetryCell 
        error={error} 
        onRetry={onRetry ? () => onRetry(result.url) : undefined} 
      />
    </TableRow>
  );
};

export default ResultTableRow;
