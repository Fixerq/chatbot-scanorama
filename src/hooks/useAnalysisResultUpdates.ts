
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { AnalysisResult } from '@/utils/types/search';

interface AnalysisResultPayload {
  url: string;
  has_chatbot: boolean;
  chatbot_solutions: string[];
  status: string;
  error?: string;
  updated_at: string;
}

function isAnalysisResultPayload(obj: any): obj is AnalysisResultPayload {
  return obj && 
    typeof obj.url === 'string' &&
    typeof obj.has_chatbot === 'boolean' &&
    Array.isArray(obj.chatbot_solutions) &&
    typeof obj.status === 'string' &&
    typeof obj.updated_at === 'string';
}

export function useAnalysisResultUpdates(batchId: string | null) {
  const subscribeToUpdates = () => {
    if (!batchId) return;

    console.log('Setting up analysis result updates for batch:', batchId);

    const channel = supabase
      .channel(`results-${batchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_results_with_requests',
          filter: `batch_id=eq.${batchId}`
        },
        (payload: RealtimePostgresChangesPayload<AnalysisResultPayload>) => {
          console.log('Analysis result update received:', payload);
          
          if (payload.new && isAnalysisResultPayload(payload.new)) {
            if (payload.new.error) {
              console.error(`Analysis failed for ${payload.new.url}:`, payload.new.error);
              toast.error(`Analysis failed for ${payload.new.url}`, {
                description: payload.new.error
              });
            } else if (payload.new.has_chatbot) {
              console.log(`Chatbot detected on ${payload.new.url}`);
              toast.success(`Chatbot detected on ${payload.new.url}`, {
                description: payload.new.chatbot_solutions.join(', ')
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up analysis result updates subscription');
      supabase.removeChannel(channel);
    };
  };

  return { subscribeToUpdates };
}
