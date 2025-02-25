
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Result } from '@/components/ResultsTable';
import { SimplifiedAnalysisResult } from '@/types/database';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Status } from '@/utils/types/search';
import { toast } from 'sonner';

const isValidAnalysisPayload = (
  payload: RealtimePostgresChangesPayload<SimplifiedAnalysisResult>
): payload is RealtimePostgresChangesPayload<SimplifiedAnalysisResult> & { new: SimplifiedAnalysisResult } => {
  return payload.new !== null && 'url' in payload.new;
};

export const useAnalysisSubscription = (setResults: React.Dispatch<React.SetStateAction<Result[]>>) => {
  useEffect(() => {
    console.log('Setting up analysis subscription');
    const channel = supabase
      .channel('analysis-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'simplified_analysis_results'
        },
        (payload: RealtimePostgresChangesPayload<SimplifiedAnalysisResult>) => {
          console.log('Received analysis update:', payload);
          if (isValidAnalysisPayload(payload)) {
            // Log every status change
            console.log(`Status update for ${payload.new.url}: ${payload.new.status}`);

            setResults(prevResults => {
              const newResults = [...prevResults];
              const index = newResults.findIndex(r => r.url === payload.new.url);
              
              if (index !== -1) {
                newResults[index] = {
                  ...newResults[index],
                  status: payload.new.status,
                  error: payload.new.error,
                  analysis_result: {
                    has_chatbot: payload.new.has_chatbot,
                    chatSolutions: payload.new.chatbot_solutions || [],
                    status: payload.new.status as Status,
                    lastChecked: payload.new.updated_at,
                    error: payload.new.error,
                    supplier: payload.new.supplier
                  }
                };
              }
              return newResults;
            });
            
            // Show different toasts based on status
            if (payload.new.status === 'error') {
              toast.error(`Analysis failed for ${payload.new.url}: ${payload.new.error}`);
            } else if (payload.new.status === 'completed') {
              if (payload.new.has_chatbot) {
                const supplier = payload.new.supplier ? ` (${payload.new.supplier})` : '';
                toast.success(`Chatbot detected on ${payload.new.url}${supplier}`);
              } else {
                toast.info(`No chatbot detected on ${payload.new.url}`);
              }
            } else if (payload.new.status === 'sent_to_zapier') {
              toast.info(`Analysis request sent to Zapier for ${payload.new.url}`);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up analysis subscription');
      supabase.removeChannel(channel);
    };
  }, [setResults]);

  return null;
};
