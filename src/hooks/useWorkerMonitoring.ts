
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WorkerInstance {
  id: string;
  status: 'idle' | 'processing';
  last_heartbeat: string;
  current_job_id: string | null;
}

export function useWorkerMonitoring() {
  const subscribeToWorkerUpdates = () => {
    console.log('Subscribing to worker status updates');

    // Subscribe to worker instance updates
    const workerChannel = supabase
      .channel('worker-monitoring')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_instances'
        },
        async (payload) => {
          console.log('Worker status update:', payload);

          if (payload.new) {
            const worker = payload.new as WorkerInstance;
            const lastHeartbeat = new Date(worker.last_heartbeat);
            const timeSinceHeartbeat = Date.now() - lastHeartbeat.getTime();

            // Check for stalled workers (no heartbeat for > 5 minutes)
            if (timeSinceHeartbeat > 5 * 60 * 1000 && worker.status === 'processing') {
              console.warn('Worker appears to be stalled:', {
                workerId: worker.id,
                lastHeartbeat,
                timeSinceHeartbeat
              });

              // Create monitoring alert for stalled worker
              const { error: alertError } = await supabase
                .from('monitoring_alerts')
                .insert({
                  metric_name: 'worker_stalled',
                  current_value: 1,
                  threshold_value: 0,
                  alert_type: 'error'
                });

              if (alertError) {
                console.error('Error creating worker stall alert:', alertError);
              }

              toast.error('Worker instance stalled', {
                description: 'Analysis may be delayed due to a stalled worker.'
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to monitoring alerts
    const alertsChannel = supabase
      .channel('monitoring-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'monitoring_alerts'
        },
        (payload) => {
          if (payload.new) {
            const alert = payload.new;
            if (alert.alert_type === 'error') {
              toast.error(`Monitoring Alert: ${alert.metric_name}`, {
                description: `Current value: ${alert.current_value}, Threshold: ${alert.threshold_value}`
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from worker monitoring');
      supabase.removeChannel(workerChannel);
      supabase.removeChannel(alertsChannel);
    };
  };

  return { subscribeToWorkerUpdates };
}
