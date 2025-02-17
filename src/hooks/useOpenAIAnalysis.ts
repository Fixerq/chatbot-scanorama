
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/types/database';

export interface OpenAIAnalysisResult {
  pattern_improvements: string[];
  error_resolution: string[];
  chatbot_confidence: number;
  retry_strategy: {
    should_retry: boolean;
    wait_time?: number;
    max_attempts?: number;
    [key: string]: Json | undefined;  // Add index signature
  };
  diagnosis: {
    worker_state: string;
    job_queue: string;
    potential_issues: string[];
    [key: string]: Json | undefined;  // Add index signature
  };
  worker_recovery: {
    should_restart: boolean;
    actions: string[];
    health_checks: string[];
    [key: string]: Json | undefined;  // Add index signature
  };
  job_optimizations: {
    batch_size: number;
    priority_rules: string[];
    timeout_settings: {
      initial: number;
      retry: number;
      [key: string]: Json | undefined;  // Add index signature for nested object
    };
    [key: string]: Json | undefined;  // Add index signature
  };
  [key: string]: Json | undefined;  // Add root level index signature
}

function isValidOpenAIAnalysisResult(obj: any): obj is OpenAIAnalysisResult {
  return (
    obj &&
    Array.isArray(obj.pattern_improvements) &&
    Array.isArray(obj.error_resolution) &&
    typeof obj.chatbot_confidence === 'number' &&
    typeof obj.retry_strategy === 'object' &&
    typeof obj.diagnosis === 'object' &&
    typeof obj.worker_recovery === 'object' &&
    typeof obj.job_optimizations === 'object'
  );
}

export function useOpenAIAnalysis() {
  const analyzeWithAI = async (url: string, patterns: any[], errorContext: any) => {
    try {
      console.log('Starting OpenAI analysis for URL:', url);
      
      // First ensure we have a cache entry
      await supabase
        .from('analysis_cache')
        .upsert({
          url,
          openai_analysis_status: 'pending',
          openai_analysis_date: null,
          openai_response: null
        })
        .eq('url', url);

      // Then check if we have a recent analysis in cache
      const { data: cacheData, error: cacheError } = await supabase
        .from('analysis_cache')
        .select('openai_response, openai_analysis_date')
        .eq('url', url)
        .maybeSingle();

      if (!cacheError && cacheData?.openai_response && cacheData?.openai_analysis_date) {
        const analysisAge = Date.now() - new Date(cacheData.openai_analysis_date).getTime();
        // Use cached analysis if it's less than 24 hours old
        if (analysisAge < 24 * 60 * 60 * 1000) {
          console.log('Using cached OpenAI analysis');
          if (isValidOpenAIAnalysisResult(cacheData.openai_response)) {
            return cacheData.openai_response;
          }
          console.warn('Cached analysis has invalid format, proceeding with new analysis');
        }
      }

      // Update cache status to processing
      await supabase
        .from('analysis_cache')
        .update({
          openai_analysis_status: 'processing',
          openai_analysis_date: new Date().toISOString()
        })
        .eq('url', url);

      const { data, error } = await supabase.functions.invoke('openai-analysis', {
        body: { url, patterns, error_context: errorContext }
      });

      if (error) {
        console.error('Error during OpenAI analysis:', error);
        toast.error('AI analysis failed', {
          description: 'Could not complete the analysis. Will continue with standard processing.'
        });
        
        // Update cache with error status
        await supabase
          .from('analysis_cache')
          .update({
            openai_analysis_status: 'error',
            openai_response: null
          })
          .eq('url', url);
          
        return null;
      }

      console.log('OpenAI analysis results:', data);

      // Create an alert for the AI analysis results
      await supabase
        .from('analysis_alerts')
        .insert({
          url,
          alert_type: 'ai_analysis',
          alert_message: 'AI Analysis completed',
          pattern_details: data.choices[0].message.content,
        });

      // Parse the AI response
      const parsedResponse = JSON.parse(data.choices[0].message.content);
      
      if (!isValidOpenAIAnalysisResult(parsedResponse)) {
        console.error('Invalid OpenAI analysis result format');
        throw new Error('Invalid analysis result format');
      }

      // Update cache with successful analysis
      await supabase
        .from('analysis_cache')
        .update({
          openai_analysis_status: 'completed',
          openai_response: parsedResponse,
          openai_analysis_date: new Date().toISOString()
        })
        .eq('url', url);

      return parsedResponse;
    } catch (error) {
      console.error('Error in AI analysis:', error);
      
      // Update cache with error status
      await supabase
        .from('analysis_cache')
        .update({
          openai_analysis_status: 'error',
          openai_response: null
        })
        .eq('url', url);
        
      return null;
    }
  };

  return {
    analyzeWithAI
  };
}
