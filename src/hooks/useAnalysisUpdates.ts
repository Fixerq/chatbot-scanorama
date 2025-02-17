
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

  const subscribeToUpdates = () => {
    if (!batchId) return;

    console.log('Setting up analysis update subscriptions for batch:', batchId);

    const batchCleanup = batchUpdates.subscribeToUpdates();
    const resultCleanup = resultUpdates.subscribeToUpdates();
    const analysisCleanup = subscribeToAnalysisResults();

    return () => {
      console.log('Cleaning up analysis update subscriptions');
      batchCleanup?.();
      resultCleanup?.();
      analysisCleanup?.();
    };
  };

  return { subscribeToUpdates };
}
