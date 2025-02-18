
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export async function testAnalysis() {
  console.log('Starting analysis for psychiatry-uk.com');
  
  try {
    // First, make sure we don't have a pending analysis for this URL
    const { data: existingAnalysis } = await supabase
      .from('simplified_analysis_results')
      .select('*')
      .eq('url', 'https://psychiatry-uk.com/')
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (existingAnalysis?.status === 'processing') {
      console.log('Analysis already in progress for this URL');
      return existingAnalysis;
    }

    // Create or update the analysis record with pending status
    const { data: analysis, error: initError } = await supabase
      .from('simplified_analysis_results')
      .upsert({
        url: 'https://psychiatry-uk.com/',
        status: 'pending',
        has_chatbot: false,
        chatbot_solutions: [],
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (initError) {
      console.error('Error initializing analysis:', initError);
      throw initError;
    }

    console.log('Created analysis record:', analysis);

    // Call the analyze-website function
    const { error } = await supabase.functions.invoke('analyze-website', {
      body: {
        urls: ['https://psychiatry-uk.com/'],
        isBatch: false,
        retry: true,
        requestId: analysis.id
      }
    });

    if (error) {
      console.error('Error analyzing website:', error);
      throw error;
    }

    console.log('Analysis initiated successfully');
    return analysis;
  } catch (error) {
    console.error('Failed to analyze website:', error);
    toast.error('Analysis failed', {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    throw error;
  }
}
