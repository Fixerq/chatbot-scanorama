
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Result } from '@/components/ResultsTable';
import { SimplifiedAnalysisResult } from '@/types/database';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Status } from '@/utils/types/search';
import { toast } from 'sonner';

const isValidAnalysisPayload = (
  payload: RealtimePostgresChangesPayload<SimplifiedAnalysisResult>
): payload is RealtimePostgresChangesPayload<SimplifiedAnalysisResult> & { new: SimplifiedAnalysisResult } => {
  return payload.new !== null && 'url' in payload.new;
};

export const useAnalysisSubscription = (setResults: React.Dispatch<React.SetStateAction<Result[]>>) => {
  const updateQueueRef = useRef<Map<string, SimplifiedAnalysisResult>>(new Map());
  const timeoutRef = useRef<number | null>(null);

  const processUpdates = useCallback(() => {
    if (updateQueueRef.current.size === 0) return;

    setResults(prevResults => {
      let hasChanges = false;
      const newResults = [...prevResults];

      updateQueueRef.current.forEach((update, url) => {
        const index = newResults.findIndex(result => result.url === url);
        if (index !== -1) {
          const oldResult = newResults[index];
          const newStatus = update.status as Status;
          
          const newResult = {
            ...oldResult,
            status: newStatus,
            error: update.error,
            analysis_result: {
              ...oldResult.analysis_result,
              has_chatbot: update.has_chatbot,
              chatSolutions: update.chatbot_solutions || [],
              status: newStatus,
              lastChecked: update.updated_at,
              error: update.error
            }
          };

          // Only update if there are actual changes
          if (JSON.stringify(oldResult) !== JSON.stringify(newResult)) {
            console.log('Updating result:', { url, oldStatus: oldResult.status, newStatus, oldResult, newResult });
            newResults[index] = newResult;
            hasChanges = true;

            // Show toast for new chatbot detections
            if (update.has_chatbot && !oldResult.analysis_result?.has_chatbot) {
              toast.success(`Chatbot detected on ${url}`);
            }
          }
        }
      });

      updateQueueRef.current.clear();
      
      if (hasChanges) {
        console.log('State updated with new results:', newResults);
        return newResults;
      }
      return prevResults;
    });
  }, [setResults]);

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
            // Add or update the payload in the queue
            updateQueueRef.current.set(payload.new.url, payload.new);

            // Clear existing timeout
            if (timeoutRef.current) {
              window.clearTimeout(timeoutRef.current);
            }

            // Set new timeout to process updates
            timeoutRef.current = window.setTimeout(() => {
              processUpdates();
            }, 100); // Batch updates within 100ms
          }
        }
      )
      .subscribe();

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [processUpdates]);

  return null;
};
