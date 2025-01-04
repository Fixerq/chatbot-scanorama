import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';

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
    const { data: { GOOGLE_API_KEY } } = await supabase.functions.invoke('get-secret', {
      body: { key: 'GOOGLE_API_KEY' }
    });
    
    const { data: { GOOGLE_CX } } = await supabase.functions.invoke('get-secret', {
      body: { key: 'GOOGLE_CX' }
    });

    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
      throw new Error('Google Search credentials not configured');
    }

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(locationQuery)}&start=${startIndex}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google API Error:', errorData);
      throw new Error('Search API request failed');
    }

    const data: GoogleSearchResult = await response.json();
    
    if (!data.items) {
      return {
        results: [],
        hasMore: false
      };
    }
    
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