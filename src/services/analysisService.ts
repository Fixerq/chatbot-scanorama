
import { supabase } from '@/integrations/supabase/client';
import { QueuedAnalysis } from '@/types/analysis';
import { ChatDetectionResult, isChatDetectionResult } from '@/types/chatbot';

const transformDatabaseResponse = (response: any): QueuedAnalysis => {
  let analysisResult: ChatDetectionResult | null = null;
  
  if (response.analysis_result) {
    if (isChatDetectionResult(response.analysis_result)) {
      analysisResult = response.analysis_result;
    } else {
      console.warn('Invalid analysis result format:', response.analysis_result);
    }
  }

  return {
    id: response.id,
    website_url: response.website_url,
    status: response.status,
    analysis_result: analysisResult,
    error_message: response.error_message,
    started_at: response.started_at,
    completed_at: response.completed_at,
    created_at: response.created_at,
    updated_at: response.updated_at,
    next_retry_at: response.next_retry_at,
    attempts: response.attempts
  };
};

export const createAnalysisRequest = async (url: string): Promise<QueuedAnalysis> => {
  console.log('Creating analysis request for URL:', url);
  
  const { data: request, error: insertError } = await supabase
    .from('analysis_requests')
    .insert([{
      website_url: url,
      status: 'pending'
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

export const invokeAnalysisFunction = async (url: string, requestId: string): Promise<ChatDetectionResult> => {
  console.log('Invoking analysis function for URL:', url, 'requestId:', requestId);
  
  try {
    const { data: analysisResult, error: analysisError } = await supabase.functions.invoke<ChatDetectionResult>(
      'analyze-website',
      {
        body: { url, requestId },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (analysisError) {
      console.error('Analysis function error:', analysisError);
      throw new Error(`Analysis error: ${analysisError.message}`);
    }

    if (!analysisResult) {
      console.error('No analysis result returned');
      throw new Error('No analysis result returned');
    }

    console.log('Analysis completed successfully:', analysisResult);
    return analysisResult;
  } catch (error) {
    console.error('Error invoking analysis function:', error);
    throw error;
  }
};
