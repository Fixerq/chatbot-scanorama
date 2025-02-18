
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Result } from '@/components/ResultsTable';
import { SimplifiedAnalysisResult } from '@/types/database';
import { Status } from '@/utils/types/search';
import { toast } from 'sonner';

const isValidStatus = (status: string): status is Status => {
  return ['pending', 'processing', 'completed', 'failed'].includes(status);
};

export const useAnalysisSubscription = (setResults: React.Dispatch<React.SetStateAction<Result[]>>) => {
  const updateCounter = useRef(new Map<string, number>());

  const handleAnalysisUpdate = useCallback((payload: { new: SimplifiedAnalysisResult }) => {
    const update = payload.new;
    
    if (!update || !update.url) {
      console.warn('Invalid analysis update received:', update);
      return;
    }

    // Track update count for this URL
    const currentCount = updateCounter.current.get(update.url) || 0;
    updateCounter.current.set(update.url, currentCount + 1);
    
    // Validate status
    if (!isValidStatus(update.status)) {
      console.warn(`Invalid status received for ${update.url}:`, update.status);
      return;
    }

    console.log(`Received update #${currentCount + 1} for ${update.url}:`, update);

    setResults(prevResults => {
      const resultIndex = prevResults.findIndex(r => r.url === update.url);
      if (resultIndex === -1) {
        console.warn('No matching result found for URL:', update.url);
        return prevResults;
      }

      const existingResult = prevResults[resultIndex];
      
      // Create new result with updated status
      const updatedResult: Result = {
        ...existingResult,
        status: update.status as Status,
        error: update.error || null,
        analysis_result: {
          has_chatbot: Boolean(update.has_chatbot),
          chatSolutions: update.chatbot_solutions || [],
          status: update.status as Status,
          lastChecked: update.updated_at || new Date().toISOString(),
          error: update.error || null
        }
      };

      // Check if there's an actual change
      if (JSON.stringify(existingResult) === JSON.stringify(updatedResult)) {
        console.log('No changes detected, skipping update for:', update.url);
        return prevResults;
      }

      console.log('Updating result:', update.url, 'New status:', update.status);
      
      // Create new array with updated result
      const newResults = [...prevResults];
      newResults[resultIndex] = updatedResult;

      // Show toast for chatbot detection
      if (update.has_chatbot && !existingResult.analysis_result?.has_chatbot) {
        toast.success(`Chatbot detected on ${update.url}`);
      }

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
        (payload: any) => {
          if (payload.new) {
            handleAnalysisUpdate(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up analysis subscription');
      supabase.removeChannel(channel);
      updateCounter.current.clear();
    };
  }, [handleAnalysisUpdate]);
};
