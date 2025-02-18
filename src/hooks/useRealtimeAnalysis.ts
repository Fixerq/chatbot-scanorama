
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SimplifiedAnalysisResult } from '@/types/database';

export const useRealtimeAnalysis = () => {
  const [results, setResults] = useState<Record<string, SimplifiedAnalysisResult>>({});

  const handleAnalysisUpdate = useCallback((payload: any) => {
    console.log('Received analysis update:', payload);
    
    if (payload.eventType === 'DELETE') {
      setResults(prev => {
        const { [payload.old?.url || '']: _, ...rest } = prev;
        return rest;
      });
      return;
    }

    const newData = payload.new;
    if (!newData) return;

    setResults(prev => ({
      ...prev,
      [newData.url]: {
        ...newData,
        status: newData.status || 'pending',
        has_chatbot: newData.has_chatbot || false,
        chatbot_solutions: newData.chatbot_solutions || []
      }
    }));
  }, []);

  const subscribeToAnalysisResults = useCallback(() => {
    console.log('Setting up analysis results subscription');
    
    const channel = supabase
      .channel('analysis-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'simplified_analysis_results'
        },
        handleAnalysisUpdate
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up analysis results subscription');
      supabase.removeChannel(channel);
    };
  }, [handleAnalysisUpdate]);

  return { results, subscribeToAnalysisResults };
};
