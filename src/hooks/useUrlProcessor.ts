
import { useState, useCallback } from 'react';
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBatchAnalysis } from './useBatchAnalysis';
import { PostgresChangesPayload } from '@/types/database';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Define the type for analysis request payload
interface AnalysisRequest {
  status: string;
  batch_id: string;
  url: string;
}

export const useUrlProcessor = () => {
  const [processing, setProcessing] = useState<boolean>(false);
  const { analyzeBatch, progress } = useBatchAnalysis();

  const processSearchResults = useCallback(async (
    results: Result[], 
    onAnalysisStart: () => void,
    onAnalysisComplete: () => void
  ) => {
    if (!results.length) return;

    setProcessing(true);
    onAnalysisStart();

    try {
      const urls = results.map(result => result.url);
      console.log(`Processing ${urls.length} URLs in batch`);

      // Subscribe to realtime updates for batch progress using the correct event type
      const subscription = supabase
        .channel('public:analysis_requests')
        .on(
          'postgres_changes' as 'INSERT' | 'UPDATE' | 'DELETE',
          {
            event: '*',
            schema: 'public',
            table: 'analysis_requests'
          },
          (payload: RealtimePostgresChangesPayload<AnalysisRequest>) => {
            console.log('Analysis request update:', payload);
            if (payload.new && payload.new.status === 'completed') {
              // Fetch the analysis result
              supabase
                .from('analysis_results')
                .select('*')
                .eq('batch_id', payload.new.batch_id)
                .eq('url', payload.new.url)
                .single()
                .then(({ data, error }) => {
                  if (!error && data) {
                    console.log('Analysis result fetched:', data);
                  }
                });
            }
          }
        )
        .subscribe();

      // Start batch analysis
      const { cleanup } = await analyzeBatch(urls);

      // Set up cleanup on component unmount
      return () => {
        subscription.unsubscribe();
        cleanup();
        setProcessing(false);
      };
    } catch (error) {
      console.error('Failed to process search results:', error);
      toast.error('Failed to analyze websites');
      setProcessing(false);
    }
  }, [analyzeBatch]);

  return {
    processing,
    progress,
    processSearchResults
  };
};
