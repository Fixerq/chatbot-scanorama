
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Result } from '@/components/ResultsTable';
import { SimplifiedAnalysisResult } from '@/types/database';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Status } from '@/utils/types/search';
import { toast } from 'sonner';

// Type guard to check if the payload has the required properties
const isValidAnalysisPayload = (
  payload: RealtimePostgresChangesPayload<SimplifiedAnalysisResult>
): payload is RealtimePostgresChangesPayload<SimplifiedAnalysisResult> & { new: SimplifiedAnalysisResult } => {
  return payload.new !== null && 'url' in payload.new;
};

export const useAnalysisSubscription = (setResults: React.Dispatch<React.SetStateAction<Result[]>>) => {
  useEffect(() => {
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
            setResults(prevResults => {
              const updatedResults = prevResults.map(result => {
                if (result.url === payload.new.url) {
                  // Notify user when chatbot is detected
                  if (payload.new.has_chatbot && !result.analysis_result?.has_chatbot) {
                    toast.success(`Chatbot detected on ${payload.new.url}`);
                  }

                  return {
                    ...result,
                    status: payload.new.status as Status,
                    error: payload.new.error,
                    analysis_result: {
                      has_chatbot: payload.new.has_chatbot,
                      chatSolutions: payload.new.chatbot_solutions || [],
                      status: payload.new.status as Status,
                      lastChecked: payload.new.updated_at,
                      error: payload.new.error
                    }
                  };
                }
                return result;
              });

              // Only trigger update if results actually changed
              if (JSON.stringify(updatedResults) !== JSON.stringify(prevResults)) {
                return updatedResults;
              }
              return prevResults;
            });
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
