
import { SearchResult } from '@/utils/types/search';
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Status } from '@/utils/types/search';

const initiateAnalysis = async (url: string) => {
  try {
    const { data: existingAnalysis } = await supabase
      .from('simplified_analysis_results')
      .select('*')
      .eq('url', url)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (existingAnalysis?.status === 'processing') {
      console.log('Analysis already in progress for this URL');
      return existingAnalysis;
    }

    const { data: analysis, error: initError } = await supabase
      .from('simplified_analysis_results')
      .upsert({
        url: url,
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

    const { error } = await supabase.functions.invoke('analyze-website', {
      body: {
        urls: [url],
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
};

export const transformSearchResult = (searchResult: SearchResult): Result => {
  console.log('Transforming search result:', searchResult);

  const transformedResult: Result = {
    url: searchResult.url,
    title: searchResult.title || searchResult.metadata?.business_name || 'Untitled',
    description: searchResult.description || '',
    business_name: searchResult.metadata?.business_name || '',
    website_url: searchResult.url,
    address: searchResult.metadata?.formatted_address || '',
    placeId: searchResult.metadata?.place_id || '',
    status: searchResult.status || 'pending',
    error: searchResult.error,
    details: {
      search_batch_id: '',
      business_name: searchResult.metadata?.business_name || '',
      title: searchResult.title || '',
      description: searchResult.description || '',
      address: searchResult.metadata?.formatted_address || '',
      website_url: searchResult.url,
    }
  };

  initiateAnalysis(transformedResult.url)
    .then(analysis => {
      if (analysis) {
        transformedResult.analysis_result = {
          has_chatbot: analysis.has_chatbot,
          chatSolutions: analysis.chatbot_solutions || [],
          status: analysis.status as Status,
          lastChecked: analysis.updated_at
        };
      }
    })
    .catch(error => {
      console.error('Error initiating analysis:', error);
      transformedResult.error = error.message;
    });

  console.log('Transformed result:', transformedResult);
  return transformedResult;
};
