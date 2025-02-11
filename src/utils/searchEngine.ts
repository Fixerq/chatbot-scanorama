
import { SearchResult, SearchResponse, GooglePlacesResult } from './types/search';
import { filterResults } from './helpers/searchHelpers';
import { supabase } from '@/integrations/supabase/client';

export const performGoogleSearch = async (
  query: string,
  country: string,
  region?: string,
  startIndex?: number
): Promise<{ results: SearchResult[]; hasMore: boolean } | null> => {
  try {
    console.log('Starting Google Places search with params:', { query, country, region });
    
    const { data: response, error } = await supabase.functions.invoke<{ data: { results: GooglePlacesResult[] } }>('search-places', {
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
      console.error('Search API error:', error);
      throw error;
    }

    if (!response?.data?.results) {
      console.error('No results found in API response:', response);
      return null;
    }

    console.log('Raw API response:', response.data.results);

    // Map Google Places results to our SearchResult type with proper null checking
    const searchResults: SearchResult[] = response.data.results
      .filter(result => result.name && result.formatted_address) // Only include results with required fields
      .map(result => ({
        title: result.name,
        description: result.formatted_address,
        url: result.website || '' // Website is optional, default to empty string
      }));

    console.log('Mapped search results:', searchResults);

    // Filter results to ensure we only get legitimate businesses
    const filteredResults = filterResults(searchResults, query, country, region);

    console.log('Final filtered results:', filteredResults);

    return {
      results: filteredResults,
      hasMore: false // Since Google Places API doesn't support pagination in the same way
    };
  } catch (error) {
    console.error('Error performing search:', error);
    throw error;
  }
};
