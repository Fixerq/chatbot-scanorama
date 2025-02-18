
import { useState, useCallback } from 'react';
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBatchAnalysis } from './useBatchAnalysis';
import { useRealtimeAnalysis } from './useRealtimeAnalysis';

export const useUrlProcessor = () => {
  const [processing, setProcessing] = useState<boolean>(false);
  const { analyzeBatch, progress } = useBatchAnalysis();
  const { subscribeToAnalysisResults } = useRealtimeAnalysis();

  const processSearchResults = useCallback(async (
    results: Result[], 
    onAnalysisStart: () => void,
    onAnalysisComplete: () => void
  ) => {
    if (!results.length) return;

    setProcessing(true);
    onAnalysisStart();

    try {
      // Subscribe to realtime updates
      const analysisCleanup = subscribeToAnalysisResults();

      // Start batch analysis
      console.log(`Starting batch analysis for ${results.length} URLs...`);
      const { cleanup } = await analyzeBatch(results);

      return () => {
        cleanup();
        analysisCleanup();
        setProcessing(false);
      };
    } catch (error) {
      console.error('Failed to process search results:', error);
      toast.error('Failed to analyze websites. Please try again.');
      setProcessing(false);
      onAnalysisComplete();
    }
  }, [analyzeBatch, subscribeToAnalysisResults]);

  return {
    processing,
    progress,
    processSearchResults
  };
};
