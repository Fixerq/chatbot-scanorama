import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Result } from '@/components/ResultsTable';
import { SimplifiedAnalysisResult } from '@/types/database';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Status } from '@/utils/types/search';
import { toast } from 'sonner';

// Type guard to check if payload is SimplifiedAnalysisResult
const isSimplifiedAnalysisResult = (payload: any): payload is SimplifiedAnalysisResult => {
  return (
    payload &&
    typeof payload === 'object' &&
    'url' in payload &&
    typeof payload.url === 'string'
  );
};

export const useAnalysisSubscription = (setResults: React.Dispatch<React.SetStateAction<Result[]>>) => {
  // Keep track of the latest updates to prevent duplicate processing
  const latestUpdates = useRef<Map<string, string>>(new Map());

  const handleAnalysisUpdate = useCallback((payload: RealtimePostgresChangesPayload<SimplifiedAnalysisResult>) => {
    const update = payload.new;
    
    // Type guard check
    if (!update || !isSimplifiedAnalysisResult(update)) {
      console.warn('Invalid analysis update received:', payload);
      return;
    }

    // Check if we've already processed this exact update
    const updateKey = `${update.url}-${update.updated_at}`;
    if (latestUpdates.current.get(update.url) === updateKey) {
      console.log('Skipping duplicate update for URL:', update.url);
      return;
    }

    console.log('Processing analysis update for URL:', update.url, 'Status:', update.status);
    latestUpdates.current.set(update.url, updateKey);

    setResults(prevResults => {
      // Find the result that needs to be updated
      const resultIndex = prevResults.findIndex(r => r.url === update.url);
      if (resultIndex === -1) {
        console.warn('No matching result found for URL:', update.url);
        return prevResults;
      }

      // Create a new array with the updated result
      const newResults = [...prevResults];
      const currentResult = prevResults[resultIndex];
      
      // Only update if the new status represents progress
      const shouldUpdate = (
        update.status === 'completed' || 
        update.status === 'error' ||
        (update.status === 'analyzing' && currentResult.status === 'pending')
      );

      if (!shouldUpdate) {
        console.log('Skipping update, no status progress:', update.status, 'current:', currentResult.status);
        return prevResults;
      }

      newResults[resultIndex] = {
        ...currentResult,
        status: update.status,
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
      if (update.has_chatbot && !currentResult.analysis_result?.has_chatbot) {
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
      latestUpdates.current.clear();
    };
  }, [handleAnalysisUpdate]);
};
