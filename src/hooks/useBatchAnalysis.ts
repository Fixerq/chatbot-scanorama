
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
    setIsProcessing(true);
    setProgress(0);
    
    try {
      console.log('Starting batch analysis process...');
      
      // Create batch and get batch ID
      const { batchId, validUrls } = await createAnalysisBatch(results);
      console.log('Created batch with ID:', batchId, 'and', validUrls.length, 'valid URLs');

      // Ensure worker is available and setup monitoring
      const cleanupWorkerMonitoring = await ensureWorkerAvailable();
      console.log('Worker availability confirmed');

      // Start the analysis
      const data = await initiateBatchAnalysis(validUrls, batchId);
      console.log('Batch analysis initiated:', data);

      // Set up subscriptions for this batch
      const cleanup = subscribeToUpdates(batchId);
      console.log('Subscriptions established for batch:', batchId);

      return { 
        batchId,
        cleanup: () => {
          cleanup();
          if (cleanupWorkerMonitoring) cleanupWorkerMonitoring();
          setIsProcessing(false);
        },
        results: data?.results
      };
      
    } catch (error) {
      console.error('Batch analysis error:', error);
      setIsProcessing(false);
      toast.error(error instanceof Error ? error.message : 'Failed to process websites');
      throw error;
    }
  };

  return {
    analyzeBatch,
    isProcessing,
    progress
  };
}
