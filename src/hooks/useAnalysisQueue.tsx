
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Result } from '@/components/ResultsTable';

interface QueuedAnalysis {
  id: string;
  website_url: string;
  status: string;
  analysis_result: any;
  error_message: string | null;
}

export const useAnalysisQueue = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [queuedResults, setQueuedResults] = useState<Result[]>([]);

  const enqueueUrls = async (urls: string[]) => {
    setIsProcessing(true);
    const initialResults = urls.map(url => ({
      url,
      status: 'Queued'
    }));
    setQueuedResults(initialResults);

    try {
      // Add URLs to the queue
      for (const url of urls) {
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
        }
      }

      // Start polling for results
      pollQueueResults(urls);
    } catch (error) {
      console.error('Error processing URLs:', error);
      toast.error('Error adding URLs to analysis queue');
      setIsProcessing(false);
    }
  };

  const pollQueueResults = useCallback(async (urls: string[]) => {
    const pollInterval = setInterval(async () => {
      const { data: queueItems, error } = await supabase
        .from('website_analysis_queue')
        .select('*')
        .in('website_url', urls);

      if (error) {
        console.error('Error polling queue:', error);
        return;
      }

      let allComplete = true;
      const updatedResults = queuedResults.map(result => {
        const queueItem = queueItems?.find(item => item.website_url === result.url);
        if (!queueItem) return result;

        if (queueItem.status === 'pending' || queueItem.status === 'processing') {
          allComplete = false;
          return {
            ...result,
            status: queueItem.status === 'pending' ? 'Queued' : 'Processing...'
          };
        }

        if (queueItem.status === 'completed' && queueItem.analysis_result) {
          return {
            ...result,
            status: 'Success',
            details: {
              ...result.details,
              chatSolutions: queueItem.analysis_result.chatSolutions || [],
              lastChecked: queueItem.analysis_result.lastChecked
            }
          };
        }

        if (queueItem.status === 'failed') {
          return {
            ...result,
            status: `Error: ${queueItem.error_message || 'Analysis failed'}`
          };
        }

        return result;
      });

      setQueuedResults(updatedResults);

      if (allComplete) {
        clearInterval(pollInterval);
        setIsProcessing(false);
        toast.success('Analysis complete!');
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup interval after 10 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval);
      setIsProcessing(false);
    }, 600000);

    return () => clearInterval(pollInterval);
  }, [queuedResults]);

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
