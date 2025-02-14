
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Result } from '@/components/ResultsTable';
import { ANALYSIS_CONSTANTS } from '@/types/analysis';
import { createAnalysisRequest, invokeAnalysisFunction } from '@/services/analysisService';
import { useAnalysisPolling } from './useAnalysisPolling';

export const useAnalysisQueue = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [queuedResults, setQueuedResults] = useState<Result[]>([]);

  const updateQueuedResult = useCallback((url: string, update: Partial<Result>) => {
    setQueuedResults(prev => prev.map(result => 
      result.url === url ? { ...result, ...update } : result
    ));
  }, []);

  const { startPolling } = useAnalysisPolling(updateQueuedResult);

  const processUrl = async (url: string, attempt = 1): Promise<void> => {
    try {
      console.log(`Processing URL (attempt ${attempt}):`, url);
      
      const request = await createAnalysisRequest(url);
      console.log('Analysis request created:', request);

      updateQueuedResult(url, { status: 'Processing...' });

      console.log('Invoking analyze-website function with params:', { url, requestId: request.id });
      await invokeAnalysisFunction(url, request.id);

      console.log('Starting polling for analysis status');
      startPolling(request.id, url);

    } catch (error) {
      console.error(`Error processing ${url}:`, error);
      if (attempt < ANALYSIS_CONSTANTS.MAX_RETRIES) {
        console.log(`Retrying URL ${url} (attempt ${attempt + 1})`);
        setTimeout(() => processUrl(url, attempt + 1), ANALYSIS_CONSTANTS.RETRY_DELAY);
        return;
      }
      
      updateQueuedResult(url, {
        status: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const enqueueUrls = async (urls: string[]) => {
    setIsProcessing(true);
    const initialResults = urls.map(url => ({
      url,
      status: 'Queued'
    }));
    setQueuedResults(initialResults);

    try {
      // Process URLs sequentially to avoid overwhelming the system
      for (const url of urls) {
        await processUrl(url);
      }
    } catch (error) {
      console.error('Error processing URLs:', error);
      toast.error('Error adding URLs to analysis queue');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearResults = () => {
    setQueuedResults([]);
    toast.success('Ready for a new search');
  };

  return {
    queuedResults,
    isProcessing,
    enqueueUrls,
    clearResults
  };
};

