
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Result } from '@/components/ResultsTable';
import { SimplifiedAnalysisResult } from '@/types/database';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Status } from '@/utils/types/search';
import { toast } from 'sonner';

// Type guard to check if the payload has the required properties
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
      const newResults = [...prevResults];
      let hasChanges = false;

      updateQueueRef.current.forEach((update, url) => {
        const index = newResults.findIndex(result => result.url === url);
        if (index !== -1) {
          const oldResult = newResults[index];
          const newResult = {
            ...oldResult,
            status: update.status as Status,
            error: update.error,
            analysis_result: {
              has_chatbot: update.has_chatbot,
              chatSolutions: update.chatbot_solutions || [],
              status: update.status as Status,
              lastChecked: update.updated_at,
              error: update.error
            }
          };

          // Only update if there are actual changes
          if (JSON.stringify(oldResult) !== JSON.stringify(newResult)) {
            newResults[index] = newResult;
            hasChanges = true;

            // Show toast only for new chatbot detections
            if (update.has_chatbot && !oldResult.analysis_result?.has_chatbot) {
              toast.success(`Chatbot detected on ${url}`);
            }
          }
        }
      });

      // Clear the update queue
      updateQueueRef.current.clear();

      return hasChanges ? newResults : prevResults;
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
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [processUpdates]);

  return null;
};
