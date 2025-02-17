
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface AnalysisBatch {
  id: string;
  processed_urls: number;
  total_urls: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  request_id: string;
}

export interface AnalysisResult {
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
}

function isValidBatchPayload(payload: any): payload is AnalysisBatch {
  return (
    payload &&
    typeof payload.processed_urls === 'number' &&
    typeof payload.total_urls === 'number' &&
    typeof payload.status === 'string'
  );
}

export function useAnalysisUpdates(
  batchId: string | null,
  onProgress: (progress: number) => void,
  onComplete: () => void
) {
  const subscribeToUpdates = () => {
    if (!batchId) return;

    const channel = supabase
      .channel(`batch-${batchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_batches',
          filter: `id=eq.${batchId}`
        },
        (payload: RealtimePostgresChangesPayload<AnalysisBatch>) => {
          console.log('Batch update:', payload);
          if (!payload.new || !isValidBatchPayload(payload.new)) {
            console.warn('Invalid batch payload received:', payload);
            return;
          }

          const { processed_urls, total_urls, status, error_message } = payload.new;
          
          // Calculate and update progress
          const progressValue = Math.round((processed_urls / total_urls) * 100);
          onProgress(progressValue);
          
          // Handle completion or failure
          if (status === 'completed') {
            console.log('Batch analysis completed');
            toast.success('Analysis complete!');
            onComplete();
          } else if (status === 'failed') {
            console.error('Batch analysis failed:', error_message);
            toast.error(error_message || 'Analysis failed');
            onComplete();
          }
        }
      )
      .subscribe();

    const resultsChannel = supabase
      .channel(`results-${batchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_results',
          filter: `batch_id=eq.${batchId}`
        },
        (payload) => {
          console.log('Analysis result update:', payload);
          if (payload.new) {
            const result = payload.new as AnalysisResult;
            if (result.has_chatbot) {
              toast.success(`Chatbot detected on one of the websites!`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(resultsChannel);
    };
  };

  return { subscribeToUpdates };
}
