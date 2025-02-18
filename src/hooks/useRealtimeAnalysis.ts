
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type SimplifiedAnalysisResult = Database['public']['Tables']['simplified_analysis_results']['Row'];

export const useRealtimeAnalysis = () => {
  const subscribeToAnalysisResults = () => {
    console.log('Setting up analysis results subscription');
    
    const channel = supabase
      .channel('realtime-analysis')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'simplified_analysis_results'
        },
        (payload: { new: SimplifiedAnalysisResult }) => {
          console.log('Analysis update received:', payload);
          
          if (payload.new) {
            const { url, has_chatbot, chatbot_solutions, error } = payload.new;

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
      console.log('Cleaning up analysis results subscription');
      supabase.removeChannel(channel);
    };
  };

  return { subscribeToAnalysisResults };
};
