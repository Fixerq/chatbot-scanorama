
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Result } from '@/components/ResultsTable';
import { SimplifiedAnalysisResult } from '@/types/database';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Status } from '@/utils/types/search';

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
          if (payload.new && 'url' in payload.new) {
            setResults(prevResults => 
              prevResults.map(result => {
                if (result.url === payload.new.url) {
                  return {
                    ...result,
                    status: payload.new.status,
                    error: payload.new.error,
                    analysis_result: {
                      has_chatbot: payload.new.has_chatbot,
                      chatSolutions: payload.new.chatbot_solutions || [],
                      status: payload.new.status as Status,
                      lastChecked: payload.new.updated_at
                    }
                  };
                }
                return result;
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setResults]);

  return null;
};
