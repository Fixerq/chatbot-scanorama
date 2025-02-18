
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Result } from '@/components/ResultsTable';
import { SimplifiedAnalysisResult } from '@/types/database';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Status } from '@/utils/types/search';
import { toast } from 'sonner';

export const useAnalysisSubscription = (setResults: React.Dispatch<React.SetStateAction<Result[]>>) => {
  const handleAnalysisUpdate = useCallback((payload: RealtimePostgresChangesPayload<SimplifiedAnalysisResult>) => {
    if (!payload.new || !payload.new.url) {
      console.warn('Invalid analysis update received:', payload);
      return;
    }

    const update = payload.new;
    console.log('Processing analysis update for URL:', update.url);

    setResults(prevResults => {
      // Find the result that needs to be updated
      const resultIndex = prevResults.findIndex(r => r.url === update.url);
      if (resultIndex === -1) return prevResults;

      // Create a new array with the updated result
      const newResults = [...prevResults];
      newResults[resultIndex] = {
        ...prevResults[resultIndex],
        status: update.status,
        error: update.error || null,
        analysis_result: {
          has_chatbot: Boolean(update.has_chatbot),
          chatSolutions: update.chatbot_solutions || [],
          status: update.status as Status,
          lastChecked: update.updated_at || new Date().toISOString(),
          error: update.error || null
        }
      };

      // Show toast for new chatbot detections
      if (update.has_chatbot && !prevResults[resultIndex].analysis_result?.has_chatbot) {
        toast.success(`Chatbot detected on ${update.url}`);
      }

      console.log('Updated result:', newResults[resultIndex]);
      return newResults;
    });
  }, [setResults]);

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
        handleAnalysisUpdate
      )
      .subscribe();

    return () => {
      console.log('Cleaning up analysis subscription');
      supabase.removeChannel(channel);
    };
  }, [handleAnalysisUpdate]);
};
