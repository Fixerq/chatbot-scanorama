
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOpenAIAnalysis } from './useOpenAIAnalysis';

interface WorkerInstance {
  id: string;
  status: 'idle' | 'processing' | 'stopped';
  last_heartbeat: string;
  current_job_id: string | null;
}

interface WorkerHealth {
  total_workers: number;
  active_workers: number;
  stalled_workers: number;
  jobs_in_progress: number;
}

interface JobMetadata {
  patterns?: string[];
  [key: string]: any;
}

export function useWorkerMonitoring() {
  const { analyzeWithAI } = useOpenAIAnalysis();

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

              // Get overall worker health
              const { data: healthData, error: healthError } = await supabase
                .rpc('check_worker_health');

              if (!healthError && healthData && healthData.length > 0) {
                const workerHealth = healthData[0] as WorkerHealth;
                
                // Get current job details if there is one
                if (worker.current_job_id) {
                  const { data: jobData } = await supabase
                    .from('analysis_job_queue')
                    .select('url, metadata, error_message')
                    .eq('id', worker.current_job_id)
                    .single();

                  if (jobData) {
                    const metadata = jobData.metadata as JobMetadata;
                    // Analyze with OpenAI
                    const aiAnalysis = await analyzeWithAI(
                      jobData.url,
                      metadata?.patterns || [],
                      {
                        error: jobData.error_message,
                        stall_duration: timeSinceHeartbeat,
                        worker_health: workerHealth
                      }
                    );

                    if (aiAnalysis) {
                      // Apply AI recommendations
                      if (aiAnalysis.retry_strategy.should_retry) {
                        await supabase
                          .from('analysis_job_queue')
                          .update({
                            retry_count: 0, // Reset retry count based on AI recommendation
                            status: 'pending',
                            error_message: null,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', worker.current_job_id);
                        
                        console.log('Applied AI retry strategy for job:', worker.current_job_id);
                      }
                    }
                  }
                }

                if (workerHealth.active_workers === 0) {
                  toast.error('All workers are currently unavailable', {
                    description: 'Analysis requests may be delayed. Our team has been notified.'
                  });
                }
              }

              // Trigger cleanup of stalled workers
              const { error: cleanupError } = await supabase
                .rpc('cleanup_stalled_workers');

              if (cleanupError) {
                console.error('Error cleaning up stalled workers:', cleanupError);
              }

              toast.error('Worker instance stalled', {
                description: 'Analysis may be delayed. The system will attempt to recover automatically.'
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from worker monitoring');
      supabase.removeChannel(workerChannel);
    };
  };

  const checkWorkerHealth = async () => {
    const { data: healthData, error } = await supabase
      .rpc('check_worker_health');

    if (error) {
      console.error('Error checking worker health:', error);
      return null;
    }

    // Return the first item from the array since we know it returns a single-item array
    return healthData && healthData.length > 0 ? healthData[0] as WorkerHealth : null;
  };

  return { 
    subscribeToWorkerUpdates,
    checkWorkerHealth
  };
}
