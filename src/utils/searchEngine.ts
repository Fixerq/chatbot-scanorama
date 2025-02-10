
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const performGoogleSearch = async (
  query: string,
  country: string,
  region: string,
  startIndex?: number
): Promise<{ results: Result[]; hasMore: boolean } | null> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session) {
      console.error('No active session found');
      toast.error('Please log in to perform searches');
      return null;
    }

    console.log('Starting search with params:', {
      query,
      country,
      region,
      startIndex
    });

    const { data, error } = await supabase.functions.invoke('search-places', {
      body: {
        query,
        country,
        region,
        startIndex: startIndex || 0
      }
    });

    if (error) {
      console.error('Search error:', error);
      toast.error('Search failed: ' + error.message);
      return null;
    }

    if (!data) {
      console.error('No data returned from search');
      toast.error('No results found. Please try again.');
      return null;
    }

    // If there's an error message in the response
    if ('error' in data) {
      console.error('Search API error:', data.error);
      toast.error('Search failed: ' + data.error);
      return null;
    }

    console.log('Search results:', data);

    return {
      results: data.results || [],
      hasMore: data.hasMore || false
    };
  } catch (error) {
    console.error('Search error:', error);
    toast.error('Search failed. Please try again later.');
    return null;
  }
};
