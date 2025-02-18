
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type SimplifiedAnalysisResult = Database['public']['Tables']['simplified_analysis_results']['Row'];

export const useRealtimeAnalysis = () => {
  const [results, setResults] = useState<Record<string, SimplifiedAnalysisResult>>({});

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
          
          setResults(prev => {
            const updated = { ...prev };
            
            if (payload.eventType === 'DELETE') {
              delete updated[payload.old?.url || ''];
              return updated;
            }
            
            const newData = payload.new;
            if (!newData) return prev;
            
            // Always update the state with new data
            updated[newData.url] = {
              ...newData,
              status: newData.status || 'pending',
              has_chatbot: newData.has_chatbot || false,
              chatbot_solutions: newData.chatbot_solutions || []
            };
            
            // Show notifications based on status changes
            if (newData.error) {
              console.error(`Analysis error for ${newData.url}:`, newData.error);
              toast.error(`Analysis failed for ${newData.url}`, {
                description: newData.error
              });
            } else if (newData.has_chatbot && !prev[newData.url]?.has_chatbot) {
              console.log(`Chatbot detected on ${newData.url}:`, newData.chatbot_solutions);
              toast.success(`Chatbot detected on ${newData.url}`, {
                description: newData.chatbot_solutions?.join(', ')
              });
            } else if (newData.status === 'completed' && prev[newData.url]?.status !== 'completed') {
              console.log(`Analysis completed for ${newData.url}`);
              if (!newData.has_chatbot) {
                toast.info(`Analysis completed for ${newData.url}`, {
                  description: 'No chatbot detected'
                });
              }
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
  };

  return { 
    subscribeToAnalysisResults,
    results
  };
};
