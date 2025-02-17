
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
  onAnalysisUpdate?: (result: AnalysisResult) => void;
}

const ResultStatusCell: React.FC<ResultStatusCellProps> = ({
  status,
  analysis_result,
  isAnalyzing,
  url,
  onAnalysisUpdate
}) => {
  const getStatusDisplay = () => {
    if (status === 'error' || analysis_result?.error) {
      return (
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{analysis_result?.error || 'Analysis failed'}</span>
        </div>
      );
    }

    if (status === 'analyzing' || isAnalyzing) {
      return (
        <div className="flex items-center gap-2 text-blue-500">
          <Loader2 className={cn(
            "w-4 h-4",
            "animate-spin"
          )} />
          <span className="text-sm">Analyzing...</span>
        </div>
      );
    }

    if (status === 'pending') {
      return (
        <div className="flex items-center gap-2 text-yellow-500">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Pending</span>
        </div>
      );
    }

    if (status === 'completed' && analysis_result) {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">Completed</span>
          </div>
          {analysis_result.lastChecked && (
            <div className="text-xs text-gray-500">
              Last checked: {new Date(analysis_result.lastChecked).toLocaleString()}
            </div>
          )}
          {analysis_result.has_chatbot && (
            <Badge variant="success" className="w-fit">
              Chatbot Detected
            </Badge>
          )}
          {analysis_result.chatSolutions && analysis_result.chatSolutions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {analysis_result.chatSolutions.map((solution: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {solution}
                </Badge>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Badge variant="secondary">
        {status || 'Unknown'}
      </Badge>
    );
  };

  return (
    <TableCell className="min-w-[200px]">
      <div className="space-y-2">
        {getStatusDisplay()}
      </div>
    </TableCell>
  );
};

export default ResultStatusCell;
