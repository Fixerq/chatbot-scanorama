
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

      // Subscribe to realtime updates for individual analysis results
      const analysisResultsChannel = supabase
        .channel('analysis-results')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'analysis_results_with_requests'  // Updated table name
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            console.log('Analysis result update received:', payload);
            
            if (payload.new) {
              const { url, has_chatbot, chatbot_solutions, status, error } = payload.new;
              console.log('Processing analysis result:', {
                url,
                has_chatbot,
                chatbot_solutions,
                status,
                error
              });

              if (has_chatbot) {
                toast.success(`Chatbot detected on ${url}`, {
                  description: chatbot_solutions?.join(', ')
                });
              }

              if (error) {
                console.error(`Analysis error for ${url}:`, error);
                toast.error(`Analysis failed for ${url}`, {
                  description: error
                });
              }
            }
          }
        )
        .subscribe();

      // Start batch analysis
      console.log(`Starting batch analysis for ${results.length} URLs...`);
      const { cleanup, batchId } = await analyzeBatch(results);

      if (!batchId) {
        throw new Error('Failed to create analysis batch');
      }

      console.log('Batch created with ID:', batchId);

      // Subscribe to batch status updates
      const batchChannel = supabase
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
            console.log('Batch status update:', payload);
            
            if (payload.new && isBatchUpdatePayload(payload.new)) {
              const { status, processed_urls, total_urls } = payload.new;
              console.log(`Batch progress: ${processed_urls}/${total_urls} URLs processed`);
              
              if (status === 'completed') {
                console.log('Batch analysis completed successfully');
                toast.success('Analysis completed!', {
                  description: `Processed ${processed_urls} URLs`
                });
                setProcessing(false);
                onAnalysisComplete();
                cleanup();
                batchChannel.unsubscribe();
                analysisResultsChannel.unsubscribe();
              } else if (status === 'failed') {
                console.error('Batch analysis failed');
                toast.error('Analysis failed. Please try again.');
                setProcessing(false);
                onAnalysisComplete();
                cleanup();
                batchChannel.unsubscribe();
                analysisResultsChannel.unsubscribe();
              }
            }
          }
        )
        .subscribe();

      // Return cleanup function
      return () => {
        batchChannel.unsubscribe();
        analysisResultsChannel.unsubscribe();
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

