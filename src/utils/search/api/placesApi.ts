
import { supabase } from '@/integrations/supabase/client';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';

interface PlacesApiResponse {
  results: Result[];
  nextPageToken?: string;
  hasMore: boolean;
}

export const callPlacesApi = async (options: {
  query: string;
  country: string;
  region: string;
  limit?: number;
  pageToken?: string;
  existingPlaceIds?: string[];
  apiKey?: string;
}): Promise<PlacesApiResponse | null> => {
  let retryCount = 0;
  const maxRetries = 3;
  const retryDelay = 1000;

  while (retryCount < maxRetries) {
    try {
      console.log('Performing Places search with params:', JSON.stringify({
        query: options.query,
        country: options.country,
        region: options.region,
        limit: options.limit,
        pageToken: options.pageToken ? 'present' : 'not present',
        existingPlaceIds: options.existingPlaceIds ? options.existingPlaceIds.length : 0,
        retryAttempt: retryCount,
        hasApiKey: !!options.apiKey
      }, null, 2));

      const { data, error } = await supabase.functions.invoke('search-places', {
        body: options
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return {
        results: data?.results || [],
        nextPageToken: data?.nextPageToken,
        hasMore: data?.hasMore || false
      };
    } catch (error) {
      console.error('Places API call error:', error);
      retryCount++;
      
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
        continue;
      }
      
      throw error;
    }
  }
  
  return null;
};
