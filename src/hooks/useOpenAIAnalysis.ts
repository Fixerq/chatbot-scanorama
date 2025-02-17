
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OpenAIAnalysisResult {
  pattern_improvements: string[];
  error_resolution: string[];
  chatbot_confidence: number;
  retry_strategy: {
    should_retry: boolean;
    wait_time?: number;
    max_attempts?: number;
  };
  diagnosis: {
    worker_state: string;
    job_queue: string;
    potential_issues: string[];
  };
  worker_recovery: {
    should_restart: boolean;
    actions: string[];
    health_checks: string[];
  };
  job_optimizations: {
    batch_size: number;
    priority_rules: string[];
    timeout_settings: {
      initial: number;
      retry: number;
    };
  };
}

export function useOpenAIAnalysis() {
  const analyzeWithAI = async (url: string, patterns: any[], errorContext: any) => {
    try {
      console.log('Starting OpenAI analysis for URL:', url);
      
      // First check if we have a recent analysis in cache
      const { data: cacheData, error: cacheError } = await supabase
        .from('analysis_cache')
        .select('openai_response, openai_analysis_date')
        .eq('url', url)
        .single();

      if (!cacheError && cacheData?.openai_response && cacheData?.openai_analysis_date) {
        const analysisAge = Date.now() - new Date(cacheData.openai_analysis_date).getTime();
        // Use cached analysis if it's less than 24 hours old
        if (analysisAge < 24 * 60 * 60 * 1000) {
          console.log('Using cached OpenAI analysis');
          return cacheData.openai_response as OpenAIAnalysisResult;
        }
      }

      // Update cache status to processing
      await supabase
        .from('analysis_cache')
        .upsert({
          url,
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
      const aiResponse = JSON.parse(data.choices[0].message.content);
      
      // Update cache with successful analysis
      await supabase
        .from('analysis_cache')
        .update({
          openai_analysis_status: 'completed',
          openai_response: aiResponse,
          openai_analysis_date: new Date().toISOString()
        })
        .eq('url', url);

      return aiResponse as OpenAIAnalysisResult;
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
