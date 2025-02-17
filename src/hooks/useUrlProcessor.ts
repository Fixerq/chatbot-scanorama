
import { useState, useCallback } from 'react';
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBatchAnalysis } from './useBatchAnalysis';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Status } from '@/utils/types/search';

interface AnalysisRequest {
  status: string;
  batch_id: string;
  url: string;
}

interface AnalysisUpdatePayload {
  url: string;
  has_chatbot: boolean;
  chatbot_solutions: string[];
  status: Status;
  error?: string;
}

interface BatchUpdatePayload {
  status: Status;
  id: string;
  processed_urls: number;
  total_urls: number;
}

function isAnalysisRequest(obj: any): obj is AnalysisRequest {
  return obj 
    && typeof obj.status === 'string'
    && typeof obj.batch_id === 'string'
    && typeof obj.url === 'string';
}

function isAnalysisUpdatePayload(obj: any): obj is AnalysisUpdatePayload {
  return obj 
    && typeof obj.url === 'string'
    && typeof obj.has_chatbot === 'boolean'
    && Array.isArray(obj.chatbot_solutions)
    && typeof obj.status === 'string';
}

function isBatchUpdatePayload(obj: any): obj is BatchUpdatePayload {
  return obj 
    && typeof obj.status === 'string'
    && typeof obj.id === 'string'
    && typeof obj.processed_urls === 'number'
    && typeof obj.total_urls === 'number';
}

export const useUrlProcessor = () => {
  const [processing, setProcessing] = useState<boolean>(false);
  const { analyzeBatch, progress } = useBatchAnalysis();

  const processSearchResults = useCallback(async (
    results: Result[], 
    onAnalysisStart: () => void,
    onAnalysisComplete: () => void
  ) => {
    if (!results.length) return;

    setProcessing(true);
    onAnalysisStart();

    try {
      // Pass the entire results array to analyzeBatch
      console.log(`Processing ${results.length} search results in batch`);

      // Subscribe to realtime updates for batch progress 
      const subscription = supabase
        .channel('analysis-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'analysis_results_with_requests'
          },
          (payload: RealtimePostgresChangesPayload<AnalysisUpdatePayload>) => {
            console.log('Analysis result update:', payload);
            
            if (payload.new && isAnalysisUpdatePayload(payload.new)) {
              const { url, has_chatbot, chatbot_solutions, status, error } = payload.new;
              if (status === 'completed') {
                console.log('Analysis completed for URL:', url, {
                  has_chatbot,
                  chatbot_solutions,
                  status
                });
              } else if (error) {
                console.error('Analysis error for URL:', url, error);
              }
            }
          }
        )
        .subscribe();

      // Start batch analysis
      const { cleanup, batchId } = await analyzeBatch(results);

      // Subscribe to specific batch updates
      const batchSubscription = supabase
        .channel(`batch-${batchId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'analysis_batches',
            filter: `id=eq.${batchId}`
          },
          (payload: RealtimePostgresChangesPayload<BatchUpdatePayload>) => {
            console.log('Batch update:', payload);
            if (payload.new && isBatchUpdatePayload(payload.new) && payload.new.status === 'completed') {
              setProcessing(false);
              onAnalysisComplete();
              cleanup();
              subscription.unsubscribe();
              batchSubscription.unsubscribe();
            }
          }
        )
        .subscribe();

      // Return cleanup function
      return () => {
        subscription.unsubscribe();
        batchSubscription.unsubscribe();
        cleanup();
        setProcessing(false);
      };
    } catch (error) {
      console.error('Failed to process search results:', error);
      toast.error('Failed to analyze websites');
      setProcessing(false);
    }
  }, [analyzeBatch]);

  return {
    processing,
    progress,
    processSearchResults
  };
};
