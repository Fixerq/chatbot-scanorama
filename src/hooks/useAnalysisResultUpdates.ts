
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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

function isValidAnalysisResult(payload: any): payload is AnalysisResult {
  return (
    payload &&
    typeof payload.has_chatbot === 'boolean' &&
    Array.isArray(payload.chatSolutions) &&
    typeof payload.status === 'string'
  );
}

export function useAnalysisResultUpdates(batchId: string | null) {
  const subscribeToUpdates = () => {
    if (!batchId) return;

    const channel = supabase
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
          if (payload.new && isValidAnalysisResult(payload.new)) {
            if (payload.new.has_chatbot) {
              toast.success(`Chatbot detected on one of the websites!`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return { subscribeToUpdates };
}
