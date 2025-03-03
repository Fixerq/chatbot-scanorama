
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Loads more results from the search API
 */
export const loadMore = async (
  query: string,
  country: string,
  region: string,
  currentResults: Result[],
  nextPageToken: string | undefined
): Promise<{ newResults: Result[]; hasMore: boolean; nextPageToken?: string } | null> => {
  try {
    if (!nextPageToken) {
      console.log('No page token provided for pagination');
      return { newResults: [], hasMore: false };
    }
    
    console.log(`Loading more results with page token: ${nextPageToken.substring(0, 10)}...`);
    
    // Get all existing place IDs for deduplication
    const existingPlaceIds = currentResults.map(result => result.id).filter(Boolean);
    
    // Request more results with the page token
    const { data, error } = await supabase.functions.invoke('search-places', {
      body: {
        query,
        country,
        region,
        pageToken: nextPageToken,
        existingPlaceIds: existingPlaceIds
      }
    });
    
    if (error) {
      console.error('Load more error:', error);
      toast.error('Failed to load more results');
      return null;
    }
    
    if (!data || !data.results) {
      console.log('No more results found');
      return { newResults: [], hasMore: false };
    }
    
    console.log(`Loaded ${data.results.length} new results`);
    
    return {
      newResults: data.results,
      nextPageToken: data.nextPageToken,
      hasMore: data.hasMore
    };
  } catch (error) {
    console.error('Load more error:', error);
    toast.error('Failed to load more results');
    return null;
  }
};
