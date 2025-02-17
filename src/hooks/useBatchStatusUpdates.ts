
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface BatchUpdatePayload {
  id: string;
  processed_urls: number;
  total_urls: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  updated_at?: string;
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

    console.log('Setting up detailed batch status monitoring for:', batchId);

    // First check current batch status
    const checkCurrentStatus = async () => {
      const { data: batch, error } = await supabase
        .from('analysis_batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (error) {
        console.error('Error checking batch status:', error);
        return;
      }

      if (batch.status === 'failed') {
        console.error('Batch already failed:', batch.error_message);
        toast.error('Analysis failed', {
          description: batch.error_message || 'Unknown error occurred'
        });
        onComplete();
        return true;
      }

      if (batch.status === 'completed') {
        console.log('Batch already completed');
        onComplete();
        return true;
      }

      return false;
    };

    // Check initial status
    checkCurrentStatus();

    // Monitor worker health
    const monitorWorkerHealth = async () => {
      const { data: healthData } = await supabase.rpc('check_worker_health');
      
      if (!healthData || healthData[0]?.active_workers === 0) {
        console.log('No active workers, attempting restart...');
        
        // Attempt to start a new worker
        const { data, error } = await supabase.functions.invoke('start-worker');
        
        if (error) {
          console.error('Failed to start worker:', error);
          toast.error('Failed to start analysis worker');
          return false;
        }
        
        console.log('Started new worker:', data);
        return true;
      }
      return true;
    };

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
          console.log('Batch status update:', payload);
          
          if (!payload.new || !isValidBatchPayload(payload.new)) {
            console.warn('Invalid batch payload received:', payload);
            return;
          }

          const { processed_urls, total_urls, status, error_message } = payload.new;
          
          // Calculate and update progress
          const progressValue = Math.round((processed_urls / total_urls) * 100);
          onProgress(progressValue);
          
          // Check for stalled batch
          if (status === 'processing') {
            const timeSinceLastUpdate = payload.new.updated_at ? 
              Date.now() - new Date(payload.new.updated_at).getTime() : 0;

            if (timeSinceLastUpdate > 30 * 1000) { // 30 seconds without progress
              console.warn('Batch appears to be stalled, checking worker health...');
              
              const workerHealthy = await monitorWorkerHealth();
              
              if (!workerHealthy) {
                toast.error('Analysis appears to be stalled', {
                  description: 'Attempting to recover...'
                });
                
                // Create stall alert
                await supabase
                  .from('analysis_alerts')
                  .insert({
                    batch_id: batchId,
                    alert_type: 'batch_stalled',
                    alert_message: `Batch ${batchId} stalled. No progress for ${Math.round(timeSinceLastUpdate / 1000)} seconds.`,
                    url: 'Batch Analysis'
                  });
              }
            }
          }
          
          if (status === 'completed') {
            console.log('Batch analysis completed successfully');
            toast.success('Analysis complete!');
            onComplete();
          } else if (status === 'failed') {
            console.error('Batch analysis failed:', error_message);
            toast.error('Analysis failed', {
              description: error_message || 'Unknown error occurred'
            });
            onComplete();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up batch status monitoring');
      supabase.removeChannel(channel);
    };
  };

  return { subscribeToUpdates };
}
