
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAnalysisUpdates } from './useAnalysisUpdates';
import { createAnalysisBatch } from './useBatchCreation';
import { useWorkerMonitoring } from './useWorkerMonitoring';

export function useBatchAnalysis() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const workerMonitoring = useWorkerMonitoring();

  const analyzeBatch = async (results: any[]) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Create batch and get batch ID
      const { batchId, validUrls } = await createAnalysisBatch(results);

      // Setup worker monitoring
      const cleanupWorkerMonitoring = workerMonitoring.subscribeToWorkerUpdates();

      // Call analyze-website function to start processing
      console.log('Sending request to analyze-website function with payload:', {
        urls: validUrls,
        batchId,
        isBatch: true
      });

      const { data, error } = await supabase.functions.invoke('analyze-website', {
        body: { 
          urls: validUrls,
          batchId,
          isBatch: true
        }
      });

      if (error) {
        console.error('Error initiating batch analysis:', error);
        toast.error('Failed to start analysis');
        throw error;
      }
      
      console.log('Batch analysis initiated successfully:', data);

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
