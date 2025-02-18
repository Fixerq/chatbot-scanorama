
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export async function testAnalysis() {
  console.log('Starting analysis for psychiatry-uk.com');
  
  try {
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
      toast.error('Analysis failed', {
        description: error.message
      });
      throw error;
    }

    if (!data) {
      console.error('No data returned from analysis');
      toast.error('Analysis failed', {
        description: 'No data returned from server'
      });
      throw new Error('No data returned from analysis');
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
