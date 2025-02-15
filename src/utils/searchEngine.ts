
import { SearchResult, SearchResponse } from '@/types/search';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SEARCH_TIMEOUT = 30000; // 30 seconds timeout

type FunctionResponse<T> = {
  data: T | null;
  error: {
    message: string;
    status?: number;
  } | null;
};

export const performGoogleSearch = async (
  query: string,
  country: string,
  region: string
): Promise<{ results: SearchResult[]; hasMore: boolean; searchBatchId: string } | null> => {
  try {
    console.log('Starting search:', { query, country, region });

    if (!query?.trim()) {
      console.error('Query parameter is required');
      toast.error('Search query is required');
      return null;
    }

    if (!country?.trim()) {
      console.error('Country parameter is required');
      toast.error('Country selection is required');
      return null;
    }

    if (!region?.trim()) {
      console.error('Region parameter is required');
      toast.error('Region selection is required');
      return null;
    }

    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Search request timed out'));
      }, SEARCH_TIMEOUT);
    });

    // Create the actual search promise
    console.log('Invoking search-places function with params:', { query, country, region });
    const searchPromise = supabase.functions.invoke<SearchResponse>('search-places', {
      body: {
        action: 'search',
        params: {
          query: query.trim(),
          country: country.trim(),
          region: region.trim()
        }
      }
    });

    // Race between the timeout and the search
    console.log('Waiting for response...');
    const response = await Promise.race([
      searchPromise,
      timeoutPromise
    ]) as FunctionResponse<SearchResponse>;

    console.log('Response received:', response);

    if (response.error) {
      console.error('Search error:', response.error);
      if (response.error.message?.includes('timed out')) {
        toast.error('Search timed out. Please try again.');
      } else {
        toast.error(response.error.message || 'Error performing search');
      }
      throw response.error;
    }

    if (!response.data?.data) {
      console.log('No results found');
      toast.info('No results found for your search');
      return null;
    }

    console.log('Search completed successfully:', response.data.data);
    return {
      results: response.data.data.results,
      hasMore: response.data.data.hasMore,
      searchBatchId: response.data.data.searchBatchId
    };
  } catch (error) {
    console.error('Search error details:', error);
    
    if (error.message?.includes('timed out')) {
      toast.error('Search request timed out. Please try again.');
    } else if (error.message?.includes('network')) {
      toast.error('Network connection error. Please check your internet connection.');
    } else {
      toast.error('Failed to perform search. Please try again.');
    }
    
    throw error;
  }
};
