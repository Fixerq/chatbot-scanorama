
import { useState } from 'react';
import { Result } from '@/components/ResultsTable';
import { useAnalysisQueue } from './useAnalysisQueue';

export const useUrlProcessor = () => {
  const {
    queuedResults: results,
    isProcessing,
    enqueueUrls: processUrls,
    clearResults,
    updateQueuedResult
  } = useAnalysisQueue();

  const processSearchResults = async (searchResults: Result[]) => {
    // Extract URLs that need analysis
    const urlsToAnalyze = searchResults
      .filter(result => !result.status || result.status === 'Queued')
      .map(result => result.url);

    if (urlsToAnalyze.length > 0) {
      await processUrls(urlsToAnalyze);
    }
  };

  return {
    results,
    isProcessing,
    processUrls,
    processSearchResults,
    clearResults,
    updateQueuedResult
  };
};
