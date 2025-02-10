
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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      toast.error('Authentication error. Please try signing in again.');
      return null;
    }

    if (!session) {
      console.error('No active session found');
      toast.error('Please sign in to perform searches');
      window.location.href = '/login';
      return null;
    }

    console.log('Starting search with session:', {
      hasSession: true,
      userId: session.user.id,
    });

    const { data, error } = await supabase.functions.invoke('search-places', {
      body: {
        query,
        country,
        region,
        startIndex: startIndex || 0
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('Search error:', error);
      if (error.message.includes('401')) {
        toast.error('Your session has expired. Please sign in again.');
        window.location.href = '/login';
      } else {
        toast.error('Search failed: ' + error.message);
      }
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
      if (data.error.includes('JWT')) {
        toast.error('Your session has expired. Please sign in again.');
        window.location.href = '/login';
      } else {
        toast.error('Search failed: ' + data.error);
      }
      return null;
    }

    console.log('Search results:', data);
    toast.success('Search completed successfully');

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
