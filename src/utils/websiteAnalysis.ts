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
    const timeoutPromise = new Promise<AnalysisResult>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Analysis timeout'));
      }, ANALYSIS_TIMEOUT);
    });

    // Create the analysis promise
    const analysisPromise = supabase.functions.invoke('analyze-website', {
      body: { url }
    });

    // Race between timeout and analysis
    const result = await Promise.race([analysisPromise, timeoutPromise]);

    if ('error' in result) {
      console.error('Error invoking analyze-website function:', result.error);
      return {
        status: 'Error analyzing website',
        details: { errorDetails: result.error.message },
        technologies: []
      };
    }

    if (!result.data) {
      console.error('No data returned from analyze-website function');
      return {
        status: 'Error analyzing website',
        details: { errorDetails: 'No data returned from analysis' },
        technologies: []
      };
    }

    return {
      status: result.data.status,
      details: result.data.details || {},
      technologies: result.data.technologies || []
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