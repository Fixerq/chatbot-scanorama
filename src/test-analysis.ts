
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export async function testAnalysis() {
  console.log('Starting analysis for psychiatry-uk.com');
  
  try {
    // First, create or update the analysis record with pending status
    const { error: initError } = await supabase
      .from('simplified_analysis_results')
      .upsert({
        url: 'https://psychiatry-uk.com/',
        status: 'pending',
        updated_at: new Date().toISOString()
      });

    if (initError) {
      console.error('Error initializing analysis:', initError);
      throw initError;
    }

    // Call the analyze-website function
    const { data, error } = await supabase.functions.invoke('analyze-website', {
      body: {
        urls: ['https://psychiatry-uk.com/'],
        isBatch: false,
        retry: true
      }
    });

    if (error) {
      console.error('Error analyzing website:', error);
      throw error;
    }

    console.log('Analysis initiated successfully:', data);
    toast.success('Analysis initiated');
    return data;
  } catch (error) {
    console.error('Failed to analyze website:', error);
    toast.error('Analysis failed', {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    throw error;
  }
}
