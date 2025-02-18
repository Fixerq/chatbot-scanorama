
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type AnalysisQueueRow = Database['public']['Tables']['analysis_queue']['Row'];

export const useWorkerMonitoring = () => {
  const [jobQueue, setJobQueue] = useState<AnalysisQueueRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueueStatus = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('analysis_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      setJobQueue(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching queue status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch queue status');
      toast.error('Failed to fetch queue status');
    } finally {
      setIsLoading(false);
    }
  };

  const retryFailedJob = async (id: string) => {
    try {
      const { data, error: updateError } = await supabase
        .from('analysis_queue')
        .update({ 
          status: 'pending',
          retry_count: 0,
          error_message: null 
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast.success('Job retry initiated');
      return data;
    } catch (err) {
      console.error('Error retrying job:', err);
      toast.error('Failed to retry job');
      throw err;
    }
  };

  useEffect(() => {
    fetchQueueStatus();

    const channel = supabase
      .channel('worker-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_queue'
        },
        (payload) => {
          console.log('Queue update received:', payload);
          fetchQueueStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    jobQueue,
    isLoading,
    error,
    retryFailedJob,
    refreshQueue: fetchQueueStatus
  };
};
