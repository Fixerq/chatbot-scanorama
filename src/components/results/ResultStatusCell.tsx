
import React from 'react';
import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { AnalysisResult } from '@/utils/types/search';
import { cn } from '@/lib/utils';

interface ResultStatusCellProps {
  status?: string;
  analysis_result?: AnalysisResult;
  isAnalyzing?: boolean;
  url?: string;
  onAnalysisUpdate?: (result: any) => void;
}

const ResultStatusCell: React.FC<ResultStatusCellProps> = ({
  status,
  analysis_result,
  isAnalyzing,
  url,
  onAnalysisUpdate
}) => {
  const getStatusDisplay = () => {
    const error = analysis_result?.error || (status === 'error' ? 'Analysis failed' : undefined);

    if (error) {
      return (
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      );
    }

    switch (status) {
      case 'analyzing':
        return (
          <div className="flex items-center gap-2 text-blue-500">
            <Loader2 className={cn(
              "w-4 h-4",
              isAnalyzing && "animate-spin"
            )} />
            <span className="text-sm">Analyzing...</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-yellow-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Pending</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Completed</span>
            </div>
            {analysis_result?.lastChecked && (
              <div className="text-xs text-gray-500">
                Last checked: {new Date(analysis_result.lastChecked).toLocaleString()}
              </div>
            )}
            {analysis_result?.has_chatbot && (
              <Badge variant="success" className="w-fit">
                Chatbot Detected
              </Badge>
            )}
          </div>
        );
      default:
        return (
          <Badge variant="secondary">
            {status || 'Unknown'}
          </Badge>
        );
    }
  };

  return (
    <TableCell>
      <div className="space-y-2">
        {getStatusDisplay()}
        
        {!isAnalyzing && analysis_result && status === 'completed' && !analysis_result.error && (
          <>
            {analysis_result.chatSolutions && analysis_result.chatSolutions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {analysis_result.chatSolutions.map((solution: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {solution}
                  </Badge>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </TableCell>
  );
};

export default ResultStatusCell;
