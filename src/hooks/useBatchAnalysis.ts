
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface AnalysisBatch {
  id: string;
  processed_urls: number;
  total_urls: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  request_id: string;
}

interface AnalysisResult {
  has_chatbot: boolean;
  chatSolutions: string[];
  status: string;
  error?: string;
  lastChecked?: string;
  details?: {
    patterns?: Array<{
      type: string;
      pattern: string;
      matched: string;
    }>;
    error?: string;
  };
}

function isValidBatchPayload(payload: any): payload is AnalysisBatch {
  return (
    payload &&
    typeof payload.processed_urls === 'number' &&
    typeof payload.total_urls === 'number' &&
    typeof payload.status === 'string'
  );
}

function isValidBusinessUrl(url: string): boolean {
  // Skip Google Maps URLs and other non-business URLs
  if (url.includes('google.com/maps') || url.includes('maps.google.com')) {
    return false;
  }
  
  // Basic URL validation
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function extractWebsiteUrl(result: any): string | null {
  // If we have a website_url in the details, use that
  if (result.details?.website_url) {
    return result.details.website_url;
  }
  
  // If the URL is already a valid business URL, use it
  if (isValidBusinessUrl(result.url)) {
    return result.url;
  }
  
  return null;
}

export function useBatchAnalysis() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const analyzeBatch = async (results: any[]) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Extract and filter valid business URLs
      const validUrls = results
        .map(result => extractWebsiteUrl(result))
        .filter((url): url is string => url !== null);

      if (validUrls.length === 0) {
        toast.error('No valid business websites found to analyze');
        setIsProcessing(false);
        return;
      }

      console.log(`Found ${validUrls.length} valid business URLs to analyze`);

      // Generate a request ID for the batch
      const request_id = crypto.randomUUID();

      // Create a new batch record
      const { data: batchData, error: batchError } = await supabase
        .from('analysis_batches')
        .insert({
          total_urls: validUrls.length,
          processed_urls: 0,
          status: 'pending' as const,
          request_id
        })
        .select()
        .single();

      if (batchError) {
        console.error('Error creating batch:', batchError);
        toast.error('Failed to start analysis');
        throw batchError;
      }

      const batchId = batchData.id;
      console.log('Batch analysis started with ID:', batchId);

      // Create analysis requests for each URL
      const requests = validUrls.map(url => ({
        batch_id: batchId,
        url,
        status: 'pending' as const,
        processed: false
      }));

      const { error: requestsError } = await supabase
        .from('analysis_requests')
        .insert(requests);

      if (requestsError) {
        console.error('Error creating analysis requests:', requestsError);
        toast.error('Failed to start analysis');
        throw requestsError;
      }

      // Call analyze-website function to start processing
      console.log('Sending request to analyze-website function with payload:', {
        urls: validUrls,
        batchId,
        isBatch: true
      });

      const { data, error } = await supabase.functions.invoke('analyze-website', {
        body: { 
          urls: validUrls,
          batchId,
          isBatch: true
        }
      });

      if (error) {
        console.error('Error initiating batch analysis:', error);
        toast.error('Failed to start analysis');
        throw error;
      }
      
      console.log('Batch analysis initiated successfully:', data);

      // Subscribe to realtime updates for this batch
      const channel = supabase
        .channel(`batch-${batchId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'analysis_batches',
            filter: `id=eq.${batchId}`
          },
          (payload: RealtimePostgresChangesPayload<AnalysisBatch>) => {
            console.log('Batch update:', payload);
            if (!payload.new || !isValidBatchPayload(payload.new)) {
              console.warn('Invalid batch payload received:', payload);
              return;
            }

            const { processed_urls, total_urls, status, error_message } = payload.new;
            
            // Calculate and update progress
            const progressValue = Math.round((processed_urls / total_urls) * 100);
            setProgress(progressValue);
            
            // Handle completion or failure
            if (status === 'completed') {
              console.log('Batch analysis completed');
              toast.success('Analysis complete!');
              setIsProcessing(false);
            } else if (status === 'failed') {
              console.error('Batch analysis failed:', error_message);
              toast.error(error_message || 'Analysis failed');
              setIsProcessing(false);
            }
          }
        )
        .subscribe();

      // Subscribe to realtime updates for individual analysis results
      const resultsChannel = supabase
        .channel(`results-${batchId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'analysis_results',
            filter: `batch_id=eq.${batchId}`
          },
          (payload) => {
            console.log('Analysis result update:', payload);
            if (payload.new) {
              const result = payload.new as AnalysisResult;
              if (result.has_chatbot) {
                toast.success(`Chatbot detected on one of the websites!`);
              }
            }
          }
        )
        .subscribe();

      // Cleanup subscription when finished or on error
      const cleanup = () => {
        console.log('Cleaning up batch analysis subscription');
        supabase.removeChannel(channel);
        supabase.removeChannel(resultsChannel);
      };

      // Return cleanup function for component unmount
      return { 
        batchId,
        cleanup,
        results: data?.results
      };
      
    } catch (error) {
      console.error('Batch analysis error:', error);
      setIsProcessing(false);
      toast.error('Failed to process websites');
      throw error;
    }
  };

  return {
    analyzeBatch,
    isProcessing,
    progress
  };
}
