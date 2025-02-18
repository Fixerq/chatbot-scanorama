
import { useState, useCallback } from 'react';
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBatchAnalysis } from './useBatchAnalysis';
import { useRealtimeAnalysis } from './useRealtimeAnalysis';

export const useUrlProcessor = () => {
  const [processing, setProcessing] = useState<boolean>(false);
  const { analyzeBatch, progress } = useBatchAnalysis();
  const { subscribeToAnalysisResults } = useRealtimeAnalysis();

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
      const { data: workerHealth, error: healthError } = await supabase.rpc('check_worker_health');
      
      if (healthError) {
        console.error('Worker health check failed:', healthError);
        toast.error('Failed to check worker status');
        throw healthError;
      }

      console.log('Worker health check:', workerHealth);

      if (!workerHealth?.[0]?.active_workers) {
        console.log('No active workers found, attempting to start worker...');
        
        // Attempt to start a worker
        const { data: workerData, error: workerError } = await supabase.functions.invoke('start-worker');
        
        if (workerError) {
          console.error('Failed to start worker:', workerError);
          toast.error('Failed to start analysis worker');
          throw workerError;
        }
        
        console.log('Started new worker:', workerData);
        
        // Wait briefly for worker to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Subscribe to realtime updates
      const analysisCleanup = subscribeToAnalysisResults();

      // Start batch analysis
      console.log(`Starting batch analysis for ${results.length} URLs...`);
      const { cleanup } = await analyzeBatch(results);

      return () => {
        cleanup();
        analysisCleanup();
        setProcessing(false);
      };
    } catch (error) {
      console.error('Failed to process search results:', error);
      toast.error('Failed to analyze websites. Please try again.');
      setProcessing(false);
      onAnalysisComplete();
    }
  }, [analyzeBatch, subscribeToAnalysisResults]);

  return {
    processing,
    progress,
    processSearchResults
  };
};
