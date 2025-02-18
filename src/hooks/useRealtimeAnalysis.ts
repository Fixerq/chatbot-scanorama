
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type SimplifiedAnalysisResult = Database['public']['Tables']['simplified_analysis_results']['Row'];

export const useRealtimeAnalysis = () => {
  const [results, setResults] = useState<Record<string, SimplifiedAnalysisResult>>({});

  const subscribeToAnalysisResults = useCallback(() => {
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
          console.log('Received analysis update:', payload);
          
          setResults(prev => {
            const updated = { ...prev };
            
            if (payload.eventType === 'DELETE') {
              delete updated[payload.old?.url || ''];
              return updated;
            }
            
            const newData = payload.new;
            if (!newData) return prev;
            
            updated[newData.url] = {
              ...newData,
              status: newData.status || 'pending',
              has_chatbot: newData.has_chatbot || false,
              chatbot_solutions: newData.chatbot_solutions || []
            };
            
            // Show toast notifications based on status
            if (newData.status === 'completed') {
              if (newData.has_chatbot) {
                toast.success(`Chatbot detected on ${newData.url}`, {
                  description: newData.chatbot_solutions?.join(', ')
                });
              } else {
                toast.info(`No chatbot detected on ${newData.url}`);
              }
            } else if (newData.status === 'failed') {
              toast.error(`Analysis failed for ${newData.url}`, {
                description: newData.error || 'Unknown error'
              });
            }
            
            return updated;
          });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up analysis results subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  return { 
    subscribeToAnalysisResults,
    results
  };
};
