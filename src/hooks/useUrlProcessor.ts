
import { useState, useCallback } from 'react';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';
import { useBatchAnalysis } from './useBatchAnalysis';

export const useUrlProcessor = () => {
  const [processing, setProcessing] = useState<boolean>(false);
  const { analyzeBatch } = useBatchAnalysis();

  const processSearchResults = useCallback(async (
    results: Result[], 
    onAnalysisStart: () => void,
    onAnalysisComplete: () => void
  ) => {
    if (!results.length) return;

    setProcessing(true);
    onAnalysisStart();

    try {
      console.log(`Starting Zapier analysis for ${results.length} URLs...`);
      await analyzeBatch(results);
      setProcessing(false);
      onAnalysisComplete();
    } catch (error) {
      console.error('Failed to process search results:', error);
      toast.error('Failed to analyze websites. Please try again.');
      setProcessing(false);
      onAnalysisComplete();
    }
  }, [analyzeBatch]);

  return {
    processing,
    processSearchResults
  };
};
