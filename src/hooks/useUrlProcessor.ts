
import { useState, useCallback } from 'react';
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBatchAnalysis, BatchStatus } from './useBatchAnalysis';

export const useUrlProcessor = () => {
  const [processing, setProcessing] = useState<boolean>(false);
  const { analyzeBatch, progress, batchStatus } = useBatchAnalysis();

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

      const { cleanup } = await analyzeBatch(urls);

      return () => {
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
    batchStatus,
    processSearchResults
  };
};
