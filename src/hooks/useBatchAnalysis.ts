
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

  const analyzeBatch = async (results: any[]) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Create batch and get batch ID
      const { batchId, validUrls } = await createAnalysisBatch(results);

      // Ensure worker is available and setup monitoring
      const cleanupWorkerMonitoring = await ensureWorkerAvailable();

      // Initiate the batch analysis
      const data = await initiateBatchAnalysis(validUrls, batchId);

      // Subscribe to realtime updates
      const { subscribeToUpdates } = useAnalysisUpdates(
        batchId,
        (newProgress) => setProgress(newProgress),
        () => {
          setIsProcessing(false);
          cleanupWorkerMonitoring();
        }
      );

      const cleanup = subscribeToUpdates();

      // Return cleanup function for component unmount
      return { 
        batchId,
        cleanup: () => {
          cleanup();
          cleanupWorkerMonitoring();
        },
        results: data?.results
      };
      
    } catch (error) {
      console.error('Batch analysis error:', error);
      setIsProcessing(false);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to process websites');
      }
      throw error;
    }
  };

  return {
    analyzeBatch,
    isProcessing,
    progress
  };
}

