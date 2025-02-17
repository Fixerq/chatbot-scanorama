
import { useState } from 'react';
import { toast } from 'sonner';
import { useAnalysisUpdates } from './useAnalysisUpdates';
import { createAnalysisBatch } from './useBatchCreation';
import { useWorkerStartup } from './useWorkerStartup';
import { useBatchInitiation } from './useBatchInitiation';

export function useBatchAnalysis() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { ensureWorkerAvailable } = useWorkerStartup();
  const { initiateBatchAnalysis } = useBatchInitiation();
  const { subscribeToUpdates } = useAnalysisUpdates(null, setProgress, () => setIsProcessing(false));

  const analyzeBatch = async (results: any[]) => {
    if (isProcessing) {
      console.log('Batch analysis already in progress, skipping...');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    let cleanupWorkerMonitoring: (() => void) | undefined;
    let batchCleanup: (() => void) | undefined;
    
    try {
      console.log('Starting batch analysis process...');
      
      // First ensure worker is available
      try {
        cleanupWorkerMonitoring = await ensureWorkerAvailable();
      } catch (workerError) {
        console.error('Worker startup failed:', workerError);
        throw new Error('Failed to start analysis worker. Please try again.');
      }
      
      console.log('Worker availability confirmed');

      // Create batch and get batch ID
      const { batchId, validUrls } = await createAnalysisBatch(results);
      console.log('Created batch with ID:', batchId, 'and', validUrls.length, 'valid URLs');

      if (!validUrls.length) {
        throw new Error('No valid URLs to analyze');
      }

      // Set up subscriptions for this batch
      batchCleanup = subscribeToUpdates(batchId);
      console.log('Subscriptions established for batch:', batchId);

      // Start the analysis
      const data = await initiateBatchAnalysis(validUrls, batchId);
      console.log('Batch analysis initiated:', data);

      return { 
        batchId,
        cleanup: () => {
          if (batchCleanup) batchCleanup();
          if (cleanupWorkerMonitoring) cleanupWorkerMonitoring();
          setIsProcessing(false);
        },
        results: data?.results
      };
      
    } catch (error) {
      console.error('Batch analysis error:', error);
      // Clean up subscriptions and monitoring if they were started
      if (batchCleanup) batchCleanup();
      if (cleanupWorkerMonitoring) cleanupWorkerMonitoring();
      setIsProcessing(false);
      
      // Show more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to process websites';
      toast.error(errorMessage);
      throw error;
    }
  };

  return {
    analyzeBatch,
    isProcessing,
    progress
  };
}
