
import { useState, useCallback } from 'react';
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBatchAnalysis } from './useBatchAnalysis';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Define the type for analysis request payload
interface AnalysisRequest {
  status: string;
  batch_id: string;
  url: string;
}

// Type guard to check if an object is an AnalysisRequest
function isAnalysisRequest(obj: any): obj is AnalysisRequest {
  return obj 
    && typeof obj.status === 'string'
    && typeof obj.batch_id === 'string'
    && typeof obj.url === 'string';
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

      // Subscribe to realtime updates for batch progress
      const subscription = supabase
        .channel('public:analysis_requests')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'analysis_requests'
          },
          (payload: RealtimePostgresChangesPayload<AnalysisRequest>) => {
            console.log('Analysis request update:', payload);
            
            // Type guard to ensure payload.new exists and has the correct shape
            if (payload.new && isAnalysisRequest(payload.new)) {
              if (payload.new.status === 'completed') {
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
