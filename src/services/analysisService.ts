
import { supabase } from '@/integrations/supabase/client';
import { QueuedAnalysis } from '@/types/analysis';
import { ChatDetectionResult } from '@/types/chatbot';

export const createAnalysisRequest = async (url: string): Promise<QueuedAnalysis> => {
  const { data: request, error: insertError } = await supabase
    .from('analysis_requests')
    .insert([{
      website_url: url,
      status: 'pending'
    }])
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create analysis request: ${insertError.message}`);
  }

  return request;
};

export const checkAnalysisStatus = async (requestId: string): Promise<QueuedAnalysis> => {
  const { data: request, error } = await supabase
    .from('analysis_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error) {
    throw new Error(`Error checking analysis status: ${error.message}`);
  }

  return request;
};

export const invokeAnalysisFunction = async (url: string, requestId: string): Promise<ChatDetectionResult> => {
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
    throw new Error(`Analysis error: ${analysisError.message}`);
  }

  if (!analysisResult) {
    throw new Error('No analysis result returned');
  }

  return analysisResult;
};

