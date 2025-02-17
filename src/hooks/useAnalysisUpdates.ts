
import { useBatchStatusUpdates } from './useBatchStatusUpdates';
import { useAnalysisResultUpdates } from './useAnalysisResultUpdates';
export type { AnalysisResult } from './useAnalysisResultUpdates';

export function useAnalysisUpdates(
  batchId: string | null,
  onProgress: (progress: number) => void,
  onComplete: () => void
) {
  const batchUpdates = useBatchStatusUpdates(batchId, onProgress, onComplete);
  const resultUpdates = useAnalysisResultUpdates(batchId);

  const subscribeToUpdates = () => {
    if (!batchId) return;

    const batchCleanup = batchUpdates.subscribeToUpdates();
    const resultCleanup = resultUpdates.subscribeToUpdates();

    return () => {
      batchCleanup?.();
      resultCleanup?.();
    };
  };

  return { subscribeToUpdates };
}
