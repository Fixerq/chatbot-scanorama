
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
}

export interface BatchStatus {
  processedUrls: number;
  totalUrls: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string | null;
}

export function useBatchAnalysis() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState<BatchStatus>({
    processedUrls: 0,
    totalUrls: 0,
    status: 'pending'
  });

  const analyzeBatch = async (urls: string[]) => {
    setIsProcessing(true);
    setProgress(0);
    setBatchStatus({
      processedUrls: 0,
      totalUrls: urls.length,
      status: 'pending'
    });
    
    try {
      const requestId = crypto.randomUUID();
      
      const { data, error } = await supabase.functions.invoke('analyze-website', {
        body: { 
          urls, 
          requestId,
          isBatch: true
        }
      });

      if (error) {
        console.error('Error initiating batch analysis:', error);
        toast.error('Failed to start analysis');
        setBatchStatus(prev => ({
          ...prev,
          status: 'failed',
          error: error.message
        }));
        throw error;
      }

      if (!data?.batchId) {
        throw new Error('No batch ID returned from analysis');
      }

      const batchId = data.batchId;
      console.log('Batch analysis started with ID:', batchId);
      
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
            const newData = payload.new as AnalysisBatch;
            
            const progressValue = Math.round((newData.processed_urls / newData.total_urls) * 100);
            setProgress(progressValue);
            
            setBatchStatus({
              processedUrls: newData.processed_urls,
              totalUrls: newData.total_urls,
              status: newData.status,
              error: newData.error_message
            });
            
            if (newData.status === 'completed') {
              console.log('Batch analysis completed');
              toast.success('Analysis complete!');
              setIsProcessing(false);
            } else if (newData.status === 'failed') {
              console.error('Batch analysis failed:', newData.error_message);
              toast.error(newData.error_message || 'Analysis failed');
              setIsProcessing(false);
            }
          }
        )
        .subscribe();

      const cleanup = () => {
        console.log('Cleaning up batch analysis subscription');
        supabase.removeChannel(channel);
      };

      return { 
        batchId,
        cleanup,
        results: data.results
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
    progress,
    batchStatus
  };
}
