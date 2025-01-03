import { supabase } from '@/integrations/supabase/client';

interface AnalysisResult {
  status: string;
  details: {
    chatSolutions?: string[];
    errorDetails?: string;
    lastChecked?: string;
  };
  technologies: string[];
}

const ANALYSIS_TIMEOUT = 30000; // 30 seconds

export const analyzeWebsite = async (url: string): Promise<AnalysisResult> => {
  try {
    console.log(`Starting analysis for ${url}`);
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Analysis timeout'));
      }, ANALYSIS_TIMEOUT);
    });

    // Create the analysis promise
    const analysisPromise = supabase.functions.invoke('analyze-website', {
      body: { url }
    });

    // Race between timeout and analysis
    const response = await Promise.race([analysisPromise, timeoutPromise]);
    
    if (!response || 'error' in response) {
      console.error('Error invoking analyze-website function:', response?.error || 'No response');
      return {
        status: 'Error analyzing website',
        details: { 
          errorDetails: response?.error?.message || 'Failed to analyze website'
        },
        technologies: []
      };
    }

    const result = response.data;
    
    if (!result) {
      console.error('No data returned from analyze-website function');
      return {
        status: 'Error analyzing website',
        details: { errorDetails: 'No data returned from analysis' },
        technologies: []
      };
    }

    return {
      status: result.status || 'Error analyzing website',
      details: result.details || {},
      technologies: result.technologies || []
    };

  } catch (error) {
    console.error('Error analyzing website:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = errorMessage === 'Analysis timeout' ? 'Analysis timed out' : 'Error analyzing website';
    
    return {
      status,
      details: { 
        errorDetails: errorMessage
      },
      technologies: []
    };
  }
};