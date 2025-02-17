
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useWorkerStartup() {
  const startNewWorker = async () => {
    console.log('Attempting to start new worker...');
    
    try {
      // First clean up any stalled workers
      await supabase.rpc('cleanup_stalled_workers');
      
      const { data, error } = await supabase.functions.invoke('start-worker');
      
      if (error) {
        console.error('Failed to start worker:', error);
        toast.error('Failed to start analysis worker');
        return null;
      }
      
      if (!data?.worker_id) {
        console.error('No worker ID returned');
        toast.error('Failed to initialize worker');
        return null;
      }
      
      console.log('Started new worker:', data);
      return data.worker_id;
    } catch (err) {
      console.error('Error starting worker:', err);
      toast.error('Failed to start worker');
      return null;
    }
  };

  const ensureWorkerAvailable = async () => {
    console.log('Checking worker availability...');
    
    // First check current worker status
    const { data: healthData, error: healthError } = await supabase.rpc('check_worker_health');
    
    if (healthError) {
      console.error('Error checking worker health:', healthError);
      throw new Error('Failed to check worker status');
    }
    
    console.log('Current worker status:', healthData);
    let retryCount = 0;
    const maxRetries = 3;
    
    while ((!healthData || healthData[0]?.active_workers === 0) && retryCount < maxRetries) {
      console.log(`No active workers found, attempt ${retryCount + 1} of ${maxRetries}`);
      
      // Clean up any stalled workers first
      await supabase.rpc('cleanup_stalled_workers');
      
      // Start new worker
      const workerId = await startNewWorker();
      
      if (!workerId) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retry
        continue;
      }
      
      // Wait for worker to initialize
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify worker started successfully
      const { data: verifyHealth } = await supabase.rpc('check_worker_health');
      
      if (verifyHealth && verifyHealth[0]?.active_workers > 0) {
        console.log('Worker started and verified');
        break;
      }
      
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before next attempt
    }
    
    if (retryCount >= maxRetries) {
      throw new Error('Failed to start worker after multiple attempts');
    }

    return subscribeToWorkerUpdates();
  };

  const subscribeToWorkerUpdates = () => {
    console.log('Setting up worker status monitoring');
    
    const channel = supabase
      .channel('worker-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_instances',
          filter: 'status=in.(active,processing)'
        },
        (payload) => {
          console.log('Worker status update:', payload);
          
          if (payload.new && 'status' in payload.new) {
            const status = payload.new.status;
            if (status === 'stopped' || status === 'failed') {
              toast.error('Worker stopped unexpectedly', {
                description: 'Analysis may be interrupted'
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up worker monitoring');
      supabase.removeChannel(channel);
    };
  };

  return { ensureWorkerAvailable };
}

