
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
      // Get current worker status
      const { data: workerHealth } = await supabase.rpc('check_worker_health');
      console.log('Worker health check:', workerHealth);

      if (!workerHealth || workerHealth[0]?.active_workers === 0) {
        console.log('No active workers found, attempting to start worker...');
        
        // Attempt to start a worker
        const { data: workerData, error: workerError } = await supabase.functions.invoke('start-worker');
        
        if (workerError || !workerData) {
          console.error('Failed to start worker:', workerError);
          throw new Error('Failed to start analysis worker');
        }
        
        console.log('Started new worker:', workerData);
        
        // Wait briefly for worker to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Pass the entire results array to analyzeBatch
      console.log(`Processing ${results.length} search results in batch`);

      // Subscribe to realtime updates for analysis progress 
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
                
                if (has_chatbot) {
                  toast.success(`Chatbot detected on ${url}`);
                }
              } else if (error) {
                console.error('Analysis error for URL:', url, error);
                toast.error(`Analysis failed for ${url}: ${error}`);
              }
            }
          }
        )
        .subscribe();

      // Start batch analysis
      const { cleanup, batchId } = await analyzeBatch(results);

      if (!batchId) {
        throw new Error('Failed to create analysis batch');
      }

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
            
            if (payload.new && isBatchUpdatePayload(payload.new)) {
              if (payload.new.status === 'completed') {
                console.log('Batch analysis completed successfully');
                setProcessing(false);
                onAnalysisComplete();
                cleanup();
                subscription.unsubscribe();
                batchSubscription.unsubscribe();
              } else if (payload.new.status === 'failed') {
                console.error('Batch analysis failed');
                toast.error('Analysis failed. Please try again.');
                setProcessing(false);
                onAnalysisComplete();
                cleanup();
                subscription.unsubscribe();
                batchSubscription.unsubscribe();
              }
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
      toast.error('Failed to analyze websites. Please try again.');
      setProcessing(false);
      onAnalysisComplete();
    }
  }, [analyzeBatch]);

  return {
    processing,
    progress,
    processSearchResults
  };
};
