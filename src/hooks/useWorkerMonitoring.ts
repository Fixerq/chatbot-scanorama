
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
      const { data: queueState } = await supabase
        .from('analysis_job_queue')
        .select('status, created_at')
        .order('created_at', { ascending: true })
        .limit(5);

      console.log('Current queue state:', queueState);

      const { data, error } = await supabase.functions.invoke('start-worker');
      
      if (error) {
        console.error('Error starting worker:', error);
        toast.error('Failed to start worker');
        return null;
      }

      console.log('Worker started successfully:', data);
      
      // Get initial worker health check
      const { data: healthData } = await supabase.rpc('check_worker_health');
      
      // Perform AI analysis on worker startup
      const aiAnalysis = await analyzeWithAI(
        'worker_startup',
        [],
        {
          worker_id: data.worker_id,
          queue_state: queueState,
          worker_health: healthData?.[0],
          startup_time: new Date().toISOString()
        }
      );

      if (aiAnalysis) {
        console.log('AI startup analysis:', aiAnalysis);
        
        // Apply any immediate optimizations
        if (aiAnalysis.job_optimizations) {
          await supabase
            .from('worker_config')
            .update({
              batch_size: aiAnalysis.job_optimizations.batch_size,
              timeout_settings: aiAnalysis.job_optimizations.timeout_settings,
              updated_at: new Date().toISOString(),
              optimization_source: 'ai_analysis'
            })
            .eq('worker_id', data.worker_id);
        }
      }

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

              // Get comprehensive system state
              const [healthData, queueData] = await Promise.all([
                supabase.rpc('check_worker_health'),
                supabase
                  .from('analysis_job_queue')
                  .select('status, error_message, created_at, updated_at')
                  .order('created_at', { ascending: true })
                  .limit(10)
              ]);

              const systemState = {
                worker_health: healthData.data?.[0],
                queue_state: queueData.data,
                stall_duration: timeSinceHeartbeat,
                last_job_id: worker.current_job_id
              };

              if (worker.current_job_id) {
                const { data: jobData } = await supabase
                  .from('analysis_job_queue')
                  .select('url, metadata, error_message')
                  .eq('id', worker.current_job_id)
                  .single();

                if (jobData) {
                  const metadata = jobData.metadata as JobMetadata;
                  
                  // Get comprehensive AI analysis
                  const aiAnalysis = await analyzeWithAI(
                    jobData.url,
                    metadata?.patterns || [],
                    {
                      error: jobData.error_message,
                      ...systemState
                    }
                  );

                  if (aiAnalysis) {
                    console.log('AI analysis results:', aiAnalysis);
                    
                    // Apply AI recommendations
                    if (aiAnalysis.worker_recovery.should_restart) {
                      // Cleanup stalled worker and start new one
                      await supabase.rpc('cleanup_stalled_workers');
                      const newWorkerId = await startWorker();
                      
                      if (newWorkerId) {
                        console.log('Started replacement worker:', newWorkerId);
                        toast.success('Started new worker with AI-optimized settings');
                      }
                    } else if (aiAnalysis.job_optimizations) {
                      // Apply optimization settings
                      await supabase
                        .from('worker_config')
                        .update({
                          batch_size: aiAnalysis.job_optimizations.batch_size,
                          timeout_settings: aiAnalysis.job_optimizations.timeout_settings,
                          updated_at: new Date().toISOString(),
                          optimization_source: 'ai_recovery'
                        })
                        .eq('worker_id', worker.id);
                        
                      console.log('Applied AI optimizations to worker configuration');
                    }

                    // Update job with AI recommendations
                    await supabase
                      .from('analysis_job_queue')
                      .update({
                        retry_count: 0,
                        status: 'pending',
                        error_message: null,
                        metadata: {
                          ...metadata,
                          ai_diagnosis: aiAnalysis.diagnosis,
                          pattern_improvements: aiAnalysis.pattern_improvements,
                          last_error_resolution: aiAnalysis.error_resolution
                        },
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', worker.current_job_id);
                  }
                }
              }

              toast.error('Worker instance stalled', {
                description: 'Analysis may be delayed. AI system is attempting recovery.'
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
