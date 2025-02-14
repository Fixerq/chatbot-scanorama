
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
const POLLING_INTERVAL = 2000; // 2 seconds between status checks

export const useAnalysisQueue = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [queuedResults, setQueuedResults] = useState<Result[]>([]);

  const checkAnalysisStatus = async (requestId: string, url: string) => {
    console.log('Checking analysis status for:', { requestId, url });
    
    const { data: request, error } = await supabase
      .from('analysis_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('Error checking analysis status:', error);
      setQueuedResults(prev => prev.map(result => 
        result.url === url ? {
          ...result,
          status: `Error: ${error.message}`
        } : result
      ));
      return true;
    }

    console.log('Analysis status:', request.status);

    if (request.status === 'completed' && request.analysis_result) {
      const result = request.analysis_result;
      if (isChatDetectionResult(result)) {
        console.log('Analysis completed successfully:', result);
        setQueuedResults(prev => prev.map(prevResult => 
          prevResult.url === url ? {
            ...prevResult,
            status: 'success',
            details: {
              ...prevResult.details,
              chatSolutions: result.chatSolutions,
              lastChecked: request.completed_at
            }
          } : prevResult
        ));
        return true;
      } else {
        console.error('Invalid analysis result format:', result);
        setQueuedResults(prev => prev.map(prevResult => 
          prevResult.url === url ? {
            ...prevResult,
            status: 'Error: Invalid analysis result format'
          } : prevResult
        ));
        return true;
      }
    } else if (request.status === 'failed') {
      console.error('Analysis failed:', request.error_message);
      setQueuedResults(prev => prev.map(result => 
        result.url === url ? {
          ...result,
          status: `Error: ${request.error_message || 'Analysis failed'}`
        } : result
      ));
      return true;
    }

    return false;
  };

  const pollAnalysisStatus = async (requestId: string, url: string) => {
    let attempts = 0;
    const maxPollingAttempts = 30; // 1 minute maximum polling time

    const poll = async () => {
      if (attempts >= maxPollingAttempts) {
        console.error('Analysis timeout reached');
        setQueuedResults(prev => prev.map(result => 
          result.url === url ? {
            ...result,
            status: 'Error: Analysis timeout'
          } : result
        ));
        return;
      }

      const isComplete = await checkAnalysisStatus(requestId, url);
      if (!isComplete) {
        attempts++;
        setTimeout(() => poll(), POLLING_INTERVAL);
      }
    };

    await poll();
  };

  const processUrl = async (url: string, attempt = 1): Promise<void> => {
    try {
      console.log(`Processing URL (attempt ${attempt}):`, url);
      
      // Log Supabase client status
      console.log('Supabase client config:', {
        url: supabase.config.supabaseUrl,
        hasAnonKey: !!supabase.config.supabaseKey,
        headers: supabase.config.headers
      });
      
      // Create analysis request record
      const { data: request, error: insertError } = await supabase
        .from('analysis_requests')
        .insert([{
          website_url: url,
          status: 'pending'
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating analysis request:', insertError);
        setQueuedResults(prev => prev.map(result => 
          result.url === url ? { ...result, status: 'Error: Failed to queue analysis' } : result
        ));
        return;
      }

      console.log('Analysis request created:', request);

      // Update local state to show processing
      setQueuedResults(prev => prev.map(result => 
        result.url === url ? { ...result, status: 'Processing...' } : result
      ));

      // Call the analyze-website function
      console.log('Invoking analyze-website function with params:', { url, requestId: request.id });
      
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke<ChatDetectionResult>(
        'analyze-website',
        {
          body: { url, requestId: request.id },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (analysisError) {
        console.error('Analysis error:', analysisError);
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying URL ${url} (attempt ${attempt + 1})`);
          setTimeout(() => processUrl(url, attempt + 1), RETRY_DELAY);
          return;
        }
        
        setQueuedResults(prev => prev.map(result => 
          result.url === url ? {
            ...result,
            status: `Error: ${analysisError.message || 'Analysis failed'}`
          } : result
        ));
        return;
      }

      console.log('Starting polling for analysis status');
      pollAnalysisStatus(request.id, url);

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
