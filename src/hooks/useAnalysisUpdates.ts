
import { useEffect } from 'react';
import { useBatchStatusUpdates } from './useBatchStatusUpdates';
import { useAnalysisResultUpdates } from './useAnalysisResultUpdates';
import { useRealtimeAnalysis } from './useRealtimeAnalysis';

export function useAnalysisUpdates(
  batchId: string | null,
  onProgress: (progress: number) => void,
  onComplete: () => void
) {
  const batchUpdates = useBatchStatusUpdates(batchId, onProgress, onComplete);
  const resultUpdates = useAnalysisResultUpdates(batchId);
  const { subscribeToAnalysisResults } = useRealtimeAnalysis();

  const subscribeToUpdates = (newBatchId: string) => {
    console.log('Setting up analysis update subscriptions for batch:', newBatchId);

    const batchCleanup = batchUpdates.subscribeToUpdates();
    const resultCleanup = resultUpdates.subscribeToUpdates();
    const analysisCleanup = subscribeToAnalysisResults();

    return () => {
      console.log('Cleaning up analysis update subscriptions');
      if (batchCleanup) batchCleanup();
      if (resultCleanup) resultCleanup();
      if (analysisCleanup) analysisCleanup();
    };
  };

  // Cleanup on unmount if there's an active batch
  useEffect(() => {
    if (batchId) {
      const cleanup = subscribeToUpdates(batchId);
      return cleanup;
    }
  }, [batchId]);

  return { subscribeToUpdates };
}
