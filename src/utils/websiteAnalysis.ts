import { supabase } from '@/integrations/supabase/client';
import { AnalysisResult } from './analysis/types';
import { analyzeContent } from './analysis/contentAnalyzer';
import { getCachedResult, cacheResult } from './analysis/cache';

const ANALYSIS_TIMEOUT = 30000; // 30 seconds

export const analyzeWebsite = async (url: string): Promise<AnalysisResult> => {
  try {
    console.log('Starting analysis for', url);
    
    // First check cache
    const cachedResult = await getCachedResult(url);
    if (cachedResult) {
      console.log('Using cached result for', url);
      return {
        status: cachedResult.status,
        details: cachedResult.details,
        technologies: cachedResult.technologies || []
      };
    }

    // Use Supabase Edge Function to analyze the website
    const { data: analysisData, error: analysisError } = await supabase
      .functions.invoke('analyze-website', {
        body: { url }
      });

    if (analysisError) {
      throw new Error(`Analysis failed: ${analysisError.message}`);
    }

    if (!analysisData) {
      throw new Error('No analysis data returned');
    }

    const result: AnalysisResult = {
      status: analysisData.status || 'Analysis completed',
      details: {
        chatSolutions: analysisData.chatSolutions || [],
        lastChecked: new Date().toISOString()
      },
      technologies: analysisData.technologies || []
    };

    // Cache the result using upsert
    try {
      const { error: upsertError } = await supabase
        .from('analyzed_urls')
        .upsert({
          url,
          status: result.status,
          details: result.details,
          technologies: result.technologies
        }, {
          onConflict: 'url',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('Error caching result:', upsertError);
      }
    } catch (cacheError) {
      console.error('Error during cache operation:', cacheError);
    }

    return result;

  } catch (error) {
    console.error('Error analyzing website:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = errorMessage.includes('abort') ? 'Analysis timed out' : 'Error analyzing website';
    
    return {
      status,
      details: { 
        errorDetails: errorMessage,
        lastChecked: new Date().toISOString()
      },
      technologies: []
    };
  }
};