
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

    console.log('Subscribing to batch status updates for:', batchId);

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
        async (payload: RealtimePostgresChangesPayload<BatchUpdatePayload>) => {
          console.log('Batch update:', payload);
          if (!payload.new || !isValidBatchPayload(payload.new)) {
            console.warn('Invalid batch payload received:', payload);
            return;
          }

          const { processed_urls, total_urls, status, error_message } = payload.new;
          
          // Calculate and update progress
          const progressValue = Math.round((processed_urls / total_urls) * 100);
          onProgress(progressValue);
          
          // Check for stalled batches and worker health
          if (status === 'processing') {
            // Check if batch is stalled (no progress for 5 minutes)
            const timeSinceLastUpdate = Date.now() - new Date(payload.new.updated_at).getTime();
            if (timeSinceLastUpdate > 5 * 60 * 1000) {
              console.warn('Batch appears to be stalled:', {
                batchId,
                lastProgress: processed_urls,
                timeSinceUpdate: timeSinceLastUpdate
              });

              // Check for active workers
              const { data: workers, error: workersError } = await supabase
                .from('worker_instances')
                .select('*')
                .eq('status', 'processing');

              if (workersError) {
                console.error('Error checking worker status:', workersError);
              } else if (!workers || workers.length === 0) {
                // No active workers found
                const { error: alertError } = await supabase
                  .from('monitoring_alerts')
                  .insert({
                    metric_name: 'no_active_workers',
                    current_value: 0,
                    threshold_value: 1,
                    alert_type: 'error'
                  });

                if (alertError) {
                  console.error('Error creating worker alert:', alertError);
                }

                toast.error('No active workers available', {
                  description: 'Analysis is delayed due to unavailable workers.'
                });
              }

              // Create stall alert
              const { error: alertError } = await supabase
                .from('analysis_alerts')
                .insert({
                  batch_id: batchId,
                  alert_type: 'batch_stalled',
                  alert_message: `Batch ${batchId} appears to be stalled. No progress for ${Math.round(timeSinceLastUpdate / 1000 / 60)} minutes.`,
                });

              if (alertError) {
                console.error('Error creating stall alert:', alertError);
              }

              toast.error('Analysis appears to be stalled', {
                description: 'The analysis has not made progress for several minutes.'
              });
            }
          }
          
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
      console.log('Unsubscribing from batch status updates');
      supabase.removeChannel(channel);
    };
  };

  return { subscribeToUpdates };
}
