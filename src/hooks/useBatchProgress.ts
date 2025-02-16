
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface AnalysisBatch {
  id: string;
  total_urls: number;
  processed_urls: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  created_at: string;
  completed_at?: string;
}

interface BatchProgress {
  totalUrls: number;
  processedUrls: number;
  status: AnalysisBatch['status'];
  error: string | null;
}

export const useBatchProgress = (batchId?: string): BatchProgress => {
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

      const batch = data as AnalysisBatch;
      setProgress({
        totalUrls: batch.total_urls,
        processedUrls: batch.processed_urls,
        status: batch.status,
        error: batch.error_message || null
      });
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
          const batch = payload.new;
          if (batch) {
            setProgress({
              totalUrls: batch.total_urls,
              processedUrls: batch.processed_urls,
              status: batch.status,
              error: batch.error_message || null
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
