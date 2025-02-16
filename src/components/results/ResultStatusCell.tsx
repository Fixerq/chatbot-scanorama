
import React, { useEffect, useRef } from 'react';
import { TableCell } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { QueuedAnalysis } from '@/types/database';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import StatusIndicator from './status/StatusIndicator';
import ChatbotBadge from './status/ChatbotBadge';
import MatchDetails from './status/MatchDetails';

interface ResultStatusCellProps {
  status?: string;
  analysis_result?: {
    has_chatbot: boolean;
    chatSolutions: string[];
    status: string;
    error?: string;
    lastChecked?: string;
    details?: {
      patterns?: Array<{
        type: string;
        pattern: string;
        matched: string;
      }>;
      error?: string;
    };
  };
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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [url, onAnalysisUpdate]);

  return (
    <TableCell>
      <div className="space-y-2">
        <StatusIndicator 
          status={status} 
          error={analysis_result?.error}
          lastChecked={analysis_result?.lastChecked}
        />
        
        {!isAnalyzing && analysis_result && status !== 'failed' && (
          <>
            <div className="flex items-center space-x-2">
              <ChatbotBadge 
                hasChatbot={analysis_result.has_chatbot}
                patterns={analysis_result.details?.patterns}
              />
            </div>
            
            <MatchDetails 
              chatSolutions={analysis_result.chatSolutions}
              lastChecked={analysis_result.lastChecked}
            />
          </>
        )}
      </div>
    </TableCell>
  );
};

export default ResultStatusCell;
