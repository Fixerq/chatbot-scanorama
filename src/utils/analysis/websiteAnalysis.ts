import { supabase } from '@/integrations/supabase/client';
import { AnalysisResult } from './types';
import { getCachedResult, cacheResult, isCacheValid } from './cache';

export const analyzeWebsite = async (url: string): Promise<AnalysisResult> => {
  try {
    console.log('Starting analysis for', url);
    
    // Check cache first
    const cachedResult = await getCachedResult(url);
    
    if (cachedResult && isCacheValid(cachedResult)) {
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
        platform: analysisData.platform || 'Unknown',
        lastChecked: new Date().toISOString()
      },
      technologies: analysisData.technologies || []
    };

    // Cache the result
    await cacheResult(url, result);
    return result;

  } catch (error) {
    console.error('Error analyzing website:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = errorMessage.includes('abort') ? 'Analysis timed out' : 'Error analyzing website';
    
    return {
      status,
      details: { 
        errorDetails: errorMessage,
        lastChecked: new Date().toISOString(),
        platform: 'Unknown'
      },
      technologies: []
    };
  }
};