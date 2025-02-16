
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface AnalysisBatch {
  id: string;
  total_urls: number;
  processed_urls: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string | null;
}

interface BatchProgress {
  totalUrls: number;
  processedUrls: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error: string | null;
}

export const useBatchProgress = (batchId?: string) => {
  const [progress, setProgress] = useState<BatchProgress>({
    totalUrls: 0,
    processedUrls: 0,
    status: 'pending',
    error: null
  });

  useEffect(() => {
    if (!batchId) return;

    // Initial fetch
    const fetchBatch = async () => {
      const { data, error } = await supabase
        .from('analysis_batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (error) {
        console.error('Error fetching batch:', error);
        setProgress(prev => ({ ...prev, error: error.message }));
        return;
      }

      if (data as AnalysisBatch) {
        const batchData = data as AnalysisBatch;
        setProgress({
          totalUrls: batchData.total_urls,
          processedUrls: batchData.processed_urls,
          status: batchData.status,
          error: batchData.error_message || null
        });
      }
    };

    fetchBatch();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`batch-${batchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'analysis_batches',
          filter: `id=eq.${batchId}`
        },
        (payload: RealtimePostgresChangesPayload<AnalysisBatch>) => {
          const newData = payload.new;
          if (newData) {
            setProgress({
              totalUrls: newData.total_urls,
              processedUrls: newData.processed_urls,
              status: newData.status,
              error: newData.error_message || null
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up batch progress subscription');
      supabase.removeChannel(channel);
    };
  }, [batchId]);

  return progress;
};
