
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Result } from '@/components/ResultsTable';
import { ChatDetectionResult, isChatDetectionResult } from '@/types/chatbot';

interface QueuedAnalysis {
  id: string;
  website_url: string;
  status: string;
  analysis_result: ChatDetectionResult | null;
  error_message: string | null;
}

const RETRY_DELAY = 2000; // 2 seconds between retries
const MAX_RETRIES = 3;

export const useAnalysisQueue = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [queuedResults, setQueuedResults] = useState<Result[]>([]);

  const processUrl = async (url: string, attempt = 1): Promise<void> => {
    try {
      console.log(`Processing URL (attempt ${attempt}):`, url);
      
      const { error } = await supabase
        .from('website_analysis_queue')
        .insert([{
          website_url: url,
          status: 'pending'
        }]);

      if (error) {
        console.error('Error enqueueing URL:', error);
        setQueuedResults(prev => prev.map(result => 
          result.url === url ? { ...result, status: 'Error: Failed to queue' } : result
        ));
        return;
      }

      // Update local state to show processing
      setQueuedResults(prev => prev.map(result => 
        result.url === url ? { ...result, status: 'Processing...' } : result
      ));

      // Poll for result
      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        pollCount++;
        console.log(`Polling for results (attempt ${pollCount}):`, url);

        const { data: queueItem, error: pollError } = await supabase
          .from('website_analysis_queue')
          .select('*')
          .eq('website_url', url)
          .maybeSingle();

        if (pollError) {
          console.error('Error polling queue:', pollError);
          return;
        }

        if (!queueItem) {
          return;
        }

        if (queueItem.status === 'completed' && queueItem.analysis_result) {
          clearInterval(pollInterval);
          
          const analysisResult = queueItem.analysis_result as ChatDetectionResult;
          
          if (isChatDetectionResult(analysisResult)) {
            setQueuedResults(prev => prev.map(result => 
              result.url === url ? {
                ...result,
                status: 'Success',
                details: {
                  chatSolutions: analysisResult.chatSolutions,
                  lastChecked: analysisResult.lastChecked
                }
              } : result
            ));
          }
        } else if (queueItem.status === 'failed') {
          clearInterval(pollInterval);
          if (attempt < MAX_RETRIES) {
            console.log(`Retrying URL ${url} (attempt ${attempt + 1})`);
            setTimeout(() => processUrl(url, attempt + 1), RETRY_DELAY);
          } else {
            setQueuedResults(prev => prev.map(result => 
              result.url === url ? {
                ...result,
                status: `Error: ${queueItem.error_message || 'Analysis failed'}`
              } : result
            ));
          }
        }

        // Stop polling after 2 minutes to prevent infinite polling
        if (pollCount > 60) {
          clearInterval(pollInterval);
          setQueuedResults(prev => prev.map(result => 
            result.url === url ? {
              ...result,
              status: 'Error: Analysis timeout'
            } : result
          ));
        }
      }, 2000); // Poll every 2 seconds

      // Cleanup interval after 2 minutes
      setTimeout(() => clearInterval(pollInterval), 120000);

    } catch (error) {
      console.error(`Error processing ${url}:`, error);
      setQueuedResults(prev => prev.map(result => 
        result.url === url ? {
          ...result,
          status: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        } : result
      ));
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

