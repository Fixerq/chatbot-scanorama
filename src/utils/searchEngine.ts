
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlacesResult {
  results: Result[];
  hasMore: boolean;
}

export const performGoogleSearch = async (
  query: string,
  country: string,
  region: string,
  startIndex?: number
): Promise<PlacesResult | null> => {
  try {
    console.log('Checking authentication status...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No active session found, redirecting to login');
      window.location.href = '/login';
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
      toast.error('Search failed. Please try again.');
      return null;
    }

    return {
      results: [],
      hasMore: false
    };
  } catch (error) {
    console.error('Search error:', error);
    toast.error('Search failed. Please try again.');
    return null;
  }
};
