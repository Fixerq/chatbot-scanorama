
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface BatchUpdatePayload {
  id: string;
  processed_urls: number;
  total_urls: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string | null;
}

function isValidBatchPayload(payload: any): payload is BatchUpdatePayload {
  return (
    payload &&
    typeof payload.processed_urls === 'number' &&
    typeof payload.total_urls === 'number' &&
    typeof payload.status === 'string'
  );
}

export function useBatchStatusUpdates(
  batchId: string | null,
  onProgress: (progress: number) => void,
  onComplete: () => void
) {
  const subscribeToUpdates = () => {
    if (!batchId) return;

    const channel = supabase
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
          if (!payload.new || !isValidBatchPayload(payload.new)) {
            console.warn('Invalid batch payload received:', payload);
            return;
          }

          const { processed_urls, total_urls, status, error_message } = payload.new;
          
          // Calculate and update progress
          const progressValue = Math.round((processed_urls / total_urls) * 100);
          onProgress(progressValue);
          
          // Handle completion or failure
          if (status === 'completed') {
            console.log('Batch analysis completed');
            toast.success('Analysis complete!');
            onComplete();
          } else if (status === 'failed') {
            console.error('Batch analysis failed:', error_message);
            toast.error(error_message || 'Analysis failed');
            onComplete();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return { subscribeToUpdates };
}
