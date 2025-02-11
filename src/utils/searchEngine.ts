
import { SearchResult } from './types/search';
import { filterResults } from './helpers/searchHelpers';
import { supabase } from '@/integrations/supabase/client';

interface SearchResponse {
  data: {
    results: SearchResult[];
    hasMore: boolean;
  };
}

export const performGoogleSearch = async (
  query: string,
  country: string,
  region?: string,
  startIndex?: number
): Promise<{ results: SearchResult[]; hasMore: boolean } | null> => {
  try {
    const { data: response, error } = await supabase.functions.invoke<SearchResponse>('search-places', {
      body: {
        action: 'search',
        params: {
          keyword: query,
          country,
          region,
          startIndex
        }
      }
    });

    if (error) {
      console.error('Search error:', error);
      throw error;
    }

    if (!response?.data) {
      return null;
    }

    // Map Google Places results to our SearchResult type
    const searchResults: SearchResult[] = response.data.results.map(result => ({
      title: result.title || result.name || '',
      description: result.description || result.formatted_address || '',
      url: result.url || result.website || ''
    }));

    // Filter results to ensure we only get legitimate businesses
    const filteredResults = filterResults(searchResults, query, country, region);

    return {
      results: filteredResults,
      hasMore: false // Since Google Places API doesn't support pagination in the same way
    };
  } catch (error) {
    console.error('Error performing search:', error);
    throw error;
  }
};
