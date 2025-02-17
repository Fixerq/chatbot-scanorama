
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useWorkerStartup() {
  const startNewWorker = async () => {
    console.log('Attempting to start new worker...');
    
    try {
      // First check if there are any active workers that might have recovered
      const { data: healthData } = await supabase.rpc('check_worker_health');
      console.log('Current worker health:', healthData);
      
      if (healthData && healthData[0]?.active_workers > 0) {
        console.log('Found active worker, no need to start new one');
        return 'active'; // Return 'active' to indicate we found an active worker
      }
      
      // Clean up any stalled workers before starting new one
      await supabase.rpc('cleanup_stalled_workers');
      
      // Start new worker with retry logic
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`Starting worker attempt ${attempt}/3`);
        
        const { data, error } = await supabase.functions.invoke('start-worker');
        
        if (error) {
          console.error(`Worker start attempt ${attempt} failed:`, error);
          if (attempt === 3) {
            toast.error('Failed to start analysis worker');
            return null;
          }
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retry
          continue;
        }
        
        if (!data?.worker_id) {
          console.error(`No worker ID returned on attempt ${attempt}`);
          if (attempt === 3) {
            toast.error('Failed to initialize worker');
            return null;
          }
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retry
          continue;
        }
        
        console.log(`Started new worker on attempt ${attempt}:`, data);
        return data.worker_id;
      }
      
      return null;
    } catch (err) {
      console.error('Error in worker startup process:', err);
      toast.error('Failed to start worker');
      return null;
    }
  };

  const ensureWorkerAvailable = async () => {
    console.log('Checking worker availability...');
    
    try {
      // First check current worker status
      const { data: healthData, error: healthError } = await supabase.rpc('check_worker_health');
      
      if (healthError) {
        console.error('Error checking worker health:', healthError);
        throw new Error('Failed to check worker status');
      }
      
      console.log('Current worker status:', healthData);
      
      // If we have active workers, no need to start new one
      if (healthData && healthData[0]?.active_workers > 0) {
        console.log('Found active worker, proceeding with analysis');
        return subscribeToWorkerUpdates();
      }
      
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        console.log(`No active workers found, attempt ${retryCount + 1} of ${maxRetries}`);
        
        // Clean up any stalled workers first
        await supabase.rpc('cleanup_stalled_workers');
        
        // Start new worker
        const workerId = await startNewWorker();
        
        if (!workerId) {
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retry
            continue;
          }
          break;
        }
        
        if (workerId === 'active') {
          console.log('Found already active worker during startup');
          break;
        }
        
        // Wait for worker to initialize
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verify worker started successfully
        const { data: verifyHealth } = await supabase.rpc('check_worker_health');
        
        if (verifyHealth && verifyHealth[0]?.active_workers > 0) {
          console.log('Worker started and verified');
          break;
        }
        
        console.log('Worker verification failed, will retry');
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      if (retryCount >= maxRetries) {
        console.error('Failed to start worker after maximum retries');
        throw new Error('Failed to start worker after multiple attempts');
      }

      return subscribeToWorkerUpdates();
      
    } catch (error) {
      console.error('Worker startup error:', error);
      toast.error('Failed to start analysis worker. Please try again.');
      throw error;
    }
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
