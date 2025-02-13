
import { useState } from 'react';
import { Result } from '@/components/ResultsTable';
import { useAnalysisQueue } from './useAnalysisQueue';

export const useUrlProcessor = () => {
  const {
    queuedResults: results,
    isProcessing,
    enqueueUrls: processUrls,
    clearResults
  } = useAnalysisQueue();

  return {
    results,
    isProcessing,
    processUrls,
    clearResults
  };
};
