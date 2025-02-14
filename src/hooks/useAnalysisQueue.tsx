import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Result } from '@/components/ResultsTable';
import { ANALYSIS_CONSTANTS } from '@/types/analysis';
import { createAnalysisRequest, invokeAnalysisFunction } from '@/services/analysisService';
import { useAnalysisPolling } from './useAnalysisPolling';
import { loggingService } from '@/services/loggingService';

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
      loggingService.logAnalysisStart(url, attempt);
      
      const request = await createAnalysisRequest(url);
      loggingService.logRequestCreated(request);

      updateQueuedResult(url, { 
        status: 'Processing...',
        isAnalyzing: true 
      });

      loggingService.logFunctionInvocation(url, request.id);
      await invokeAnalysisFunction(url, request.id);

      loggingService.logPollingStart();
      startPolling(request.id, url);

    } catch (error) {
      loggingService.logAnalysisError(url, error);
      if (attempt < ANALYSIS_CONSTANTS.MAX_RETRIES) {
        loggingService.logRetryAttempt(url, attempt + 1);
        setTimeout(() => processUrl(url, attempt + 1), ANALYSIS_CONSTANTS.RETRY_DELAY);
        return;
      }
      
      updateQueuedResult(url, {
        status: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isAnalyzing: false
      });
    }
  };

  const enqueueUrls = async (urls: string[]) => {
    setIsProcessing(true);
    const initialResults = urls.map(url => ({
      url,
      status: 'Queued',
      isAnalyzing: true
    }));
    
    // Update only the new URLs, keep existing results
    setQueuedResults(prev => {
      const existingUrls = new Set(prev.map(r => r.url));
      const newResults = initialResults.filter(r => !existingUrls.has(r.url));
      return [...prev, ...newResults];
    });

    try {
      for (const url of urls) {
        await processUrl(url);
      }
    } catch (error) {
      loggingService.logProcessingError(error);
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
    clearResults,
    updateQueuedResult
  };
};
