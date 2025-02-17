
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { AnalysisUpdatePayload, isAnalysisUpdatePayload } from './types/analysisTypes';

export const useRealtimeAnalysis = () => {
  const subscribeToAnalysisResults = () => {
    console.log('Setting up general analysis results subscription');
    
    const channel = supabase
      .channel('analysis-results')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_results_with_requests'
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Analysis result update received:', payload);
          
          if (payload.new && isAnalysisUpdatePayload(payload.new)) {
            const { url, has_chatbot, chatbot_solutions, status, error } = payload.new;
            console.log('Processing analysis result:', {
              url,
              has_chatbot,
              chatbot_solutions,
              status,
              error
            });

            if (error) {
              console.error(`Analysis error for ${url}:`, error);
              toast.error(`Analysis failed for ${url}`, {
                description: error
              });
            } else if (has_chatbot) {
              toast.success(`Chatbot detected on ${url}`, {
                description: chatbot_solutions?.join(', ')
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up general analysis results subscription');
      supabase.removeChannel(channel);
    };
  };

  return { subscribeToAnalysisResults };
};
