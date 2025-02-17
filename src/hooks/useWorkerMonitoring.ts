
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

  const startWorker = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('start-worker');
      
      if (error) {
        console.error('Error starting worker:', error);
        toast.error('Failed to start worker');
        return null;
      }

      console.log('Worker started successfully:', data);
      toast.success('Worker started successfully');
      return data.worker_id;
    } catch (error) {
      console.error('Error invoking start-worker function:', error);
      toast.error('Failed to start worker');
      return null;
    }
  };

  const subscribeToWorkerUpdates = () => {
    console.log('Subscribing to worker status updates');

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

            if (timeSinceHeartbeat > 5 * 60 * 1000 && worker.status === 'processing') {
              console.warn('Worker appears to be stalled:', {
                workerId: worker.id,
                lastHeartbeat,
                timeSinceHeartbeat
              });

              const { data: healthData, error: healthError } = await supabase
                .rpc('check_worker_health');

              if (!healthError && healthData && healthData.length > 0) {
                const workerHealth = healthData[0] as WorkerHealth;
                
                if (worker.current_job_id) {
                  const { data: jobData } = await supabase
                    .from('analysis_job_queue')
                    .select('url, metadata, error_message')
                    .eq('id', worker.current_job_id)
                    .single();

                  if (jobData) {
                    const metadata = jobData.metadata as JobMetadata;
                    // Get AI analysis and recommendations
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
                      console.log('AI analysis results:', aiAnalysis);
                      
                      // Apply AI recommendations
                      if (aiAnalysis.retry_strategy.should_retry) {
                        const waitTime = aiAnalysis.retry_strategy.wait_time || 0;
                        
                        // Wait for the recommended time before retrying
                        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                        
                        await supabase
                          .from('analysis_job_queue')
                          .update({
                            retry_count: 0,
                            status: 'pending',
                            error_message: null,
                            metadata: {
                              ...metadata,
                              ai_recommendations: aiAnalysis.pattern_improvements,
                              last_error_resolution: aiAnalysis.error_resolution
                            },
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', worker.current_job_id);
                        
                        console.log('Applied AI retry strategy for job:', worker.current_job_id);
                        
                        toast.success('Analysis will be retried with AI optimizations');
                      } else {
                        console.log('AI recommended not to retry the job');
                        toast.error('Analysis cannot be recovered automatically', {
                          description: aiAnalysis.error_resolution[0] || 'Manual intervention required'
                        });
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

    return healthData && healthData.length > 0 ? healthData[0] as WorkerHealth : null;
  };

  return { 
    startWorker,
    subscribeToWorkerUpdates,
    checkWorkerHealth
  };
}
