
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PostgrestSingleResponse, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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

export const useBatchProgress = (batchId: string | null): BatchProgress | null => {
  const [progress, setProgress] = useState<BatchProgress | null>(null);

  useEffect(() => {
    if (!batchId) return;

    // Initial fetch
    const fetchBatch = async () => {
      const { data, error }: PostgrestSingleResponse<AnalysisBatch> = await supabase
        .from('analysis_batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (error || !data) {
        console.error('Error fetching batch:', error);
        setProgress(null);
        return;
      }

      setProgress({
        totalUrls: data.total_urls,
        processedUrls: data.processed_urls,
        status: data.status,
        error: data.error_message
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
          if (!batch) {
            setProgress(null);
            return;
          }
          
          setProgress({
            totalUrls: batch.total_urls,
            processedUrls: batch.processed_urls,
            status: batch.status,
            error: batch.error_message
          });
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
