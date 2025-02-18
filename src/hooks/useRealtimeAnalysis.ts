
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type SimplifiedAnalysisResult = Database['public']['Tables']['simplified_analysis_results']['Row'];

export const useRealtimeAnalysis = () => {
  const subscribeToAnalysisResults = () => {
    console.log('Setting up analysis results subscription');
    
    const channel = supabase
      .channel('realtime-analysis')
      .on<SimplifiedAnalysisResult>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'simplified_analysis_results'
        },
        (payload: RealtimePostgresChangesPayload<SimplifiedAnalysisResult>) => {
          console.log('Analysis update received:', payload);
          
          const newData = payload.new as SimplifiedAnalysisResult;
          if (newData && Object.keys(newData).length > 0) {
            if (newData.error) {
              console.error(`Analysis error for ${newData.url}:`, newData.error);
              toast.error(`Analysis failed for ${newData.url}`, {
                description: newData.error
              });
            } else if (newData.has_chatbot) {
              toast.success(`Chatbot detected on ${newData.url}`, {
                description: newData.chatbot_solutions?.join(', ')
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up analysis results subscription');
      supabase.removeChannel(channel);
    };
  };

  return { subscribeToAnalysisResults };
};
