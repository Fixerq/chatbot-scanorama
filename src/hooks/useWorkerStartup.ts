
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useWorkerMonitoring } from './useWorkerMonitoring';

export function useWorkerStartup() {
  const workerMonitoring = useWorkerMonitoring();

  const ensureWorkerAvailable = async () => {
    const { data: healthData } = await supabase.rpc('check_worker_health');
    
    if (!healthData || healthData[0]?.active_workers === 0) {
      console.log('No active workers found, starting new worker...');
      const workerId = await workerMonitoring.startWorker();
      
      if (!workerId) {
        throw new Error('Failed to start worker');
      }
      
      console.log('Started new worker with ID:', workerId);
    }

    return workerMonitoring.subscribeToWorkerUpdates();
  };

  return { ensureWorkerAvailable };
}

