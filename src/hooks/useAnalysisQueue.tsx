
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

      // Call the analyze-website function directly
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke<ChatDetectionResult>(
        'analyze-website',
        {
          body: { url }
        }
      );

      if (analysisError || !analysisResult) {
        console.error('Analysis error:', analysisError || 'No result returned');
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying URL ${url} (attempt ${attempt + 1})`);
          setTimeout(() => processUrl(url, attempt + 1), RETRY_DELAY);
          return;
        }
        setQueuedResults(prev => prev.map(result => 
          result.url === url ? {
            ...result,
            status: `Error: ${analysisError?.message || 'Analysis failed'}`
          } : result
        ));
        return;
      }

      if (isChatDetectionResult(analysisResult)) {
        setQueuedResults(prev => prev.map(result => 
          result.url === url ? {
            ...result,
            status: analysisResult.status,
            details: {
              ...result.details,
              chatSolutions: analysisResult.chatSolutions,
              lastChecked: analysisResult.lastChecked
            }
          } : result
        ));
      } else {
        console.error('Invalid analysis result structure:', analysisResult);
        setQueuedResults(prev => prev.map(result => 
          result.url === url ? {
            ...result,
            status: 'Error: Invalid analysis result'
          } : result
        ));
      }

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
