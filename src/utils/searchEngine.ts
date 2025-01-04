import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoogleSearchResult {
  items: Array<{
    link: string;
    title: string;
    snippet: string;
  }>;
}

export const performGoogleSearch = async (
  query: string,
  country: string,
  region: string,
  startIndex: number = 1
): Promise<{ results: Result[]; hasMore: boolean }> => {
  const locationQuery = region ? `${query} in ${region}, ${country}` : `${query} in ${country}`;
  
  console.log('Performing Google search with query:', locationQuery);
  
  try {
    // Fetch secrets from Supabase
    const { data: secretData, error: secretError } = await supabase.functions.invoke('get-secret', {
      body: { key: 'GOOGLE_API_KEY' }
    });
    
    if (secretError || !secretData?.GOOGLE_API_KEY) {
      console.error('Failed to fetch Google API key:', secretError);
      toast.error('Failed to fetch Google API key. Please check your configuration.');
      throw new Error('Google API key not found');
    }

    const { data: cxData, error: cxError } = await supabase.functions.invoke('get-secret', {
      body: { key: 'GOOGLE_CX' }
    });

    if (cxError || !cxData?.GOOGLE_CX) {
      console.error('Failed to fetch Google CX:', cxError);
      toast.error('Failed to fetch Search Engine ID. Please check your configuration.');
      throw new Error('Google CX not found');
    }

    const GOOGLE_API_KEY = secretData.GOOGLE_API_KEY;
    const GOOGLE_CX = cxData.GOOGLE_CX;

    console.log('Making Google API request with query:', locationQuery);
    
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(locationQuery)}&start=${startIndex}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google API Error:', errorData);
      
      if (errorData.error?.status === 'PERMISSION_DENIED') {
        toast.error(
          'Custom Search API is not enabled. Please enable it in the Google Cloud Console.',
          {
            action: {
              label: 'Enable API',
              onClick: () => window.open('https://console.developers.google.com/apis/api/customsearch.googleapis.com/overview', '_blank')
            }
          }
        );
      } else {
        toast.error(`Search API request failed: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      throw new Error('Search API request failed');
    }

    const data: GoogleSearchResult = await response.json();
    
    if (!data.items) {
      console.log('No search results found');
      return {
        results: [],
        hasMore: false
      };
    }
    
    console.log(`Found ${data.items.length} search results`);
    
    const results: Result[] = data.items.map(item => ({
      url: item.link,
      status: 'Processing...',
      details: {
        title: item.title,
        description: item.snippet
      }
    }));

    return {
      results,
      hasMore: data.items && data.items.length === 10 // Google returns max 10 results per page
    };
  } catch (error) {
    console.error('Google search error:', error);
    throw error;
  }
};