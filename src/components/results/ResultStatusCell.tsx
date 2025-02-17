
import React, { useEffect, useState } from 'react';
import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { AnalysisResult } from '@/utils/types/search';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { QueuedAnalysis } from '@/types/database';

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
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !onAnalysisUpdate) return;

    const channel = supabase
      .channel(`analysis-${url.replace(/[^a-zA-Z0-9]/g, '_')}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_results',
          filter: `url=eq.${url}`
        },
        (payload: RealtimePostgresChangesPayload<QueuedAnalysis>) => {
          console.log('Analysis result update:', payload);
          if (payload.eventType !== 'DELETE' && payload.new) {
            onAnalysisUpdate(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [url, onAnalysisUpdate]);

  const getStatusDisplay = () => {
    if (error || status === 'error' || analysis_result?.error) {
      return (
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">
            {error || analysis_result?.error || 'Analysis failed'}
          </span>
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
            {status}
          </Badge>
        );
    }
  };

  return (
    <TableCell>
      <div className="space-y-2">
        {getStatusDisplay()}
        
        {!isAnalyzing && analysis_result && status === 'completed' && !error && (
          <>
            {analysis_result.chatSolutions && analysis_result.chatSolutions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {analysis_result.chatSolutions.map((solution, index) => (
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

