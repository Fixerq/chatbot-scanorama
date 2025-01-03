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

export const analyzeWebsite = async (url: string): Promise<AnalysisResult> => {
  try {
    console.log(`Starting analysis for ${url}`);
    
    const { data, error } = await supabase.functions.invoke('analyze-website', {
      body: { url }
    });

    if (error) {
      console.error('Error invoking analyze-website function:', error);
      return {
        status: 'Error analyzing website',
        details: { errorDetails: error.message },
        technologies: []
      };
    }

    if (!data) {
      console.error('No data returned from analyze-website function');
      return {
        status: 'Error analyzing website',
        details: { errorDetails: 'No data returned from analysis' },
        technologies: []
      };
    }

    return {
      status: data.status,
      details: data.details || {},
      technologies: data.technologies || []
    };

  } catch (error) {
    console.error('Error analyzing website:', error);
    return {
      status: 'Error analyzing website',
      details: { 
        errorDetails: error instanceof Error ? error.message : 'Unknown error'
      },
      technologies: []
    };
  }
};