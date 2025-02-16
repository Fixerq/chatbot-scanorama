
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface AnalysisBatch {
  id: string;
  processed_urls: number;
  total_urls: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  request_id: string;
}

export function useBatchAnalysis() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const analyzeBatch = async (urls: string[]) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Generate a request ID for the batch
      const request_id = crypto.randomUUID();

      // Create a new batch record
      const { data: batchData, error: batchError } = await supabase
        .from('analysis_batches')
        .insert({
          total_urls: urls.length,
          processed_urls: 0,
          status: 'pending' as const,
          request_id
        })
        .select()
        .single();

      if (batchError) {
        console.error('Error creating batch:', batchError);
        toast.error('Failed to start analysis');
        throw batchError;
      }

      const batchId = batchData.id;
      console.log('Batch analysis started with ID:', batchId);

      // Create analysis requests for each URL
      const requests = urls.map(url => ({
        batch_id: batchId,
        url,
        status: 'pending' as const
      }));

      const { error: requestsError } = await supabase
        .from('analysis_requests')
        .insert(requests);

      if (requestsError) {
        console.error('Error creating analysis requests:', requestsError);
        toast.error('Failed to start analysis');
        throw requestsError;
      }

      // Call analyze-website function to start processing
      const { data, error } = await supabase.functions.invoke('analyze-website', {
        body: { 
          urls,
          batchId,
          isBatch: true
        }
      });

      if (error) {
        console.error('Error initiating batch analysis:', error);
        toast.error('Failed to start analysis');
        throw error;
      }
      
      // Subscribe to realtime updates for this batch
      const channel = supabase
        .channel(`batch-${batchId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'analysis_batches',
            filter: `id=eq.${batchId}`
          },
          (payload: RealtimePostgresChangesPayload<AnalysisBatch>) => {
            console.log('Batch update:', payload);
            if (!payload.new) return;

            const { processed_urls, total_urls, status, error_message } = payload.new;
            
            // Calculate and update progress
            const progressValue = Math.round((processed_urls / total_urls) * 100);
            setProgress(progressValue);
            
            // Handle completion or failure
            if (status === 'completed') {
              console.log('Batch analysis completed');
              toast.success('Analysis complete!');
              setIsProcessing(false);
            } else if (status === 'failed') {
              console.error('Batch analysis failed:', error_message);
              toast.error(error_message || 'Analysis failed');
              setIsProcessing(false);
            }
          }
        )
        .subscribe();

      // Cleanup subscription when finished or on error
      const cleanup = () => {
        console.log('Cleaning up batch analysis subscription');
        supabase.removeChannel(channel);
      };

      // Return cleanup function for component unmount
      return { 
        batchId,
        cleanup,
        results: data?.results
      };
      
    } catch (error) {
      console.error('Batch analysis error:', error);
      setIsProcessing(false);
      toast.error('Failed to process websites');
      throw error;
    }
  };

  return {
    analyzeBatch,
    isProcessing,
    progress
  };
}
