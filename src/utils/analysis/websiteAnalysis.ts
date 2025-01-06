import { supabase } from '@/integrations/supabase/client';
import { AnalysisResult } from './types';
import { getCachedResult, cacheResult } from './cache';

export const analyzeWebsite = async (url: string): Promise<AnalysisResult> => {
  try {
    console.log('Starting analysis for', url);
    
    // Check cache first
    const cachedResult = await getCachedResult(url);
    
    if (cachedResult) {
      console.log('Using cached result for', url);
      return {
        status: cachedResult.status,
        details: cachedResult.details,
        technologies: cachedResult.technologies || []
      };
    }

    console.log('Calling analyze-website function for', url);
    // Use Supabase Edge Function to analyze the website
    const { data: analysisData, error: analysisError } = await supabase
      .functions.invoke('analyze-website', {
        body: { url }
      });

    if (analysisError) {
      console.error('Edge function error:', analysisError);
      throw new Error(`Analysis failed: ${analysisError.message}`);
    }

    if (!analysisData) {
      console.error('No analysis data returned for', url);
      throw new Error('No analysis data returned');
    }

    console.log('Analysis data received:', analysisData);

    const result: AnalysisResult = {
      status: analysisData.status || 'Analysis completed',
      details: {
        chatSolutions: analysisData.chatSolutions || [],
        lastChecked: new Date().toISOString()
      },
      technologies: analysisData.technologies || []
    };

    // Cache the result
    try {
      await cacheResult(url, result);
      console.log('Successfully cached result for', url);
    } catch (cacheError) {
      console.error('Error caching result:', cacheError);
      // Continue even if caching fails
    }

    return result;

  } catch (error) {
    console.error('Error analyzing website:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Determine a more specific error message based on the error
    let status = 'Error analyzing website';
    if (errorMessage.includes('timeout') || errorMessage.includes('abort')) {
      status = 'Analysis timed out';
    } else if (errorMessage.includes('404')) {
      status = 'Website not found';
    } else if (errorMessage.includes('403')) {
      status = 'Access denied';
    } else if (errorMessage.includes('network')) {
      status = 'Network error';
    }
    
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