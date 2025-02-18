
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Result } from '@/components/ResultsTable';
import { SimplifiedAnalysisResult } from '@/types/database';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Status } from '@/utils/types/search';
import { toast } from 'sonner';

// Type guard to ensure we have a valid analysis result
const isValidAnalysisUpdate = (
  payload: RealtimePostgresChangesPayload<SimplifiedAnalysisResult>
): payload is RealtimePostgresChangesPayload<SimplifiedAnalysisResult> & { new: SimplifiedAnalysisResult } => {
  return payload.new !== null && 
    typeof payload.new === 'object' && 
    'url' in payload.new &&
    'status' in payload.new;
};

export const useAnalysisSubscription = (setResults: React.Dispatch<React.SetStateAction<Result[]>>) => {
  const handleAnalysisUpdate = useCallback((payload: RealtimePostgresChangesPayload<SimplifiedAnalysisResult>) => {
    if (!isValidAnalysisUpdate(payload)) {
      console.warn('Received invalid analysis update:', payload);
      return;
    }
    
    const update = payload.new;
    console.log('Received analysis update:', update);

    setResults(prevResults => {
      return prevResults.map(result => {
        if (result.url === update.url) {
          console.log('Updating result for URL:', result.url);
          
          // Create updated result with new analysis data
          const updatedResult = {
            ...result,
            status: update.status as Status,
            error: update.error ?? null,
            analysis_result: {
              has_chatbot: Boolean(update.has_chatbot),
              chatSolutions: update.chatbot_solutions ?? [],
              status: update.status as Status,
              lastChecked: update.updated_at ?? new Date().toISOString(),
              error: update.error ?? null
            }
          };

          // Show toast for new chatbot detections
          if (update.has_chatbot && !result.analysis_result?.has_chatbot) {
            toast.success(`Chatbot detected on ${update.url}`);
          }

          console.log('Updated result:', updatedResult);
          return updatedResult;
        }
        return result;
      });
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

  return null;
};

