
import { supabase } from '@/integrations/supabase/client';

export async function testAnalysis() {
  try {
    console.log('Starting analysis for psychiatry-uk.com');
    
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

    console.log('Analysis response:', data);
    return data;
  } catch (error) {
    console.error('Failed to analyze website:', error);
    throw error;
  }
}
