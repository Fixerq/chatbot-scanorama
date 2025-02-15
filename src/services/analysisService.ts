
import { supabase } from '@/integrations/supabase/client';
import { QueuedAnalysis } from '@/types/analysis';
import { ChatDetectionResult, isChatDetectionResult } from '@/types/chatbot';

const transformDatabaseResponse = (response: any): QueuedAnalysis => {
  let analysisResult: ChatDetectionResult | null = null;
  
  if (response.result) {
    if (isChatDetectionResult(response.result)) {
      analysisResult = response.result;
    } else {
      console.warn('Invalid analysis result format:', response.result);
    }
  }

  return {
    id: response.id,
    website_url: response.url,
    status: response.status,
    analysis_result: analysisResult,
    error_message: response.error_message,
    retry_count: 0,
    max_retries: 3,
    last_error: response.error_message,
    retry_after: null,
    started_at: null,
    completed_at: null,
    created_at: response.created_at,
    updated_at: response.updated_at,
    next_retry_at: null,
    attempts: 0
  };
};

export const createAnalysisRequest = async (url: string): Promise<QueuedAnalysis> => {
  console.log('Creating analysis request for URL:', url);
  
  const { data: request, error: insertError } = await supabase
    .from('analysis_requests')
    .insert([{
      url: url,
      status: 'pending',
      result: null
    }])
    .select()
    .single();

  if (insertError) {
    console.error('Failed to create analysis request:', insertError);
    throw new Error(`Failed to create analysis request: ${insertError.message}`);
  }

  return transformDatabaseResponse(request);
};

export const checkAnalysisStatus = async (requestId: string): Promise<QueuedAnalysis> => {
  console.log('Checking analysis status for request:', requestId);
  
  const { data: request, error } = await supabase
    .from('analysis_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error) {
    console.error('Error checking analysis status:', error);
    throw new Error(`Error checking analysis status: ${error.message}`);
  }

  return transformDatabaseResponse(request);
};

export const incrementRetries = async (requestId: string): Promise<void> => {
  console.log('Incrementing retries for request:', requestId);
  
  const { error } = await supabase
    .rpc('increment_retry_count', { request_id: requestId });

  if (error) {
    console.error('Error incrementing retries:', error);
    throw new Error(`Error incrementing retries: ${error.message}`);
  }
};

export const invokeAnalysisFunction = async (url: string, requestId: string): Promise<ChatDetectionResult> => {
  console.log('Invoking analysis function for URL:', url, 'requestId:', requestId);
  
  try {
    const { data, error } = await supabase.functions.invoke<ChatDetectionResult>(
      'analyze-website',
      {
        body: {
          url: url.trim(),
          requestId: requestId.trim()
        }
      }
    );

    if (error) {
      console.error('Analysis function error:', error);
      throw new Error(`Analysis error: ${error.message}`);
    }

    if (!data) {
      console.error('No analysis result returned');
      throw new Error('No analysis result returned');
    }

    console.log('Analysis completed successfully:', data);
    return data;
  } catch (error) {
    console.error('Error invoking analysis function:', error);
    throw error;
  }
};

export const subscribeToAnalysisUpdates = (
  requestId: string,
  callback: (analysis: QueuedAnalysis) => void
): (() => void) => {
  const subscription = supabase
    .channel('analysis_updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'analysis_requests',
        filter: `id=eq.${requestId}`
      },
      (payload) => {
        if (payload.new) {
          callback(transformDatabaseResponse(payload.new));
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};
