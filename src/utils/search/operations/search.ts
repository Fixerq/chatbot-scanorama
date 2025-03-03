import { Result } from '@/components/ResultsTable';
import { performGoogleSearch } from '../index';
import { toast } from 'sonner';
import { enhanceSearchQuery } from './enhancer';
import { validateSearchParams } from './validator';
import { supabase } from '@/integrations/supabase/client';

/**
 * Executes a search with all the necessary parameters
 */
export const executeSearch = async (
  query: string,
  country: string,
  region: string,
  apiKey: string,
  resultsLimit: number,
  currentResults: Result[]
): Promise<{ newResults: Result[]; hasMore: boolean; nextPageToken?: string } | null> => {
  try {
    // Validate search parameters
    if (!validateSearchParams(query, country)) {
      return { newResults: [], hasMore: false };
    }

    const enhancedQuery = await enhanceSearchQuery(query, country, region);

    // Add more specific terms to the query to find businesses more likely to have chatbots
    const chatbotTerms = "website customer service";
    const finalQuery = `${enhancedQuery} ${chatbotTerms}`;

    console.log('Starting search with params:', {
      originalQuery: query,
      enhancedQuery,
      finalQuery,
      country,
      region,
      limit: resultsLimit
    });

    // Get all existing place IDs for deduplication (if any)
    const existingPlaceIds = currentResults.map(result => result.id).filter(Boolean);

    // Perform the search
    const { data, error } = await supabase.functions.invoke('search-places', {
      body: {
        query: finalQuery,
        country,
        region,
        existingPlaceIds
      }
    });

    if (error) {
      console.error('Search error:', error);
      toast.error('Search service is currently unavailable.', {
        description: 'Please try again later or try different search terms.',
        duration: 5000
      });
      return { newResults: [], hasMore: false };
    }

    if (!data || !data.results) {
      console.log('Search returned empty results array');
      
      // Try a more generic search as fallback
      toast.info('No results found with initial search. Trying alternative search terms...');
      
      // Try with just the plain query and country
      const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke('search-places', {
        body: {
          query,
          country,
          region: ''  // Empty region for broader search
        }
      });
      
      if (fallbackError || !fallbackData?.results || fallbackData.results.length === 0) {
        toast.error('No results found. Please try different search terms or locations.', {
          duration: 5000
        });
        return { newResults: [], hasMore: false };
      }
      
      console.log(`Fallback search found ${fallbackData.results.length} results`);
      toast.success(`Found ${fallbackData.results.length} results with modified search criteria`);
      
      return {
        newResults: fallbackData.results,
        nextPageToken: fallbackData.nextPageToken,
        hasMore: fallbackData.hasMore
      };
    }

    if (data.results.length === 0) {
      toast.info('No new results found. Try different search terms or locations.');
    } else {
      toast.success(`Found ${data.results.length} new results to analyze`);
    }

    return {
      newResults: data.results,
      nextPageToken: data.nextPageToken,
      hasMore: data.hasMore
    };
  } catch (error) {
    console.error('Search execution error:', error);
    toast.error('Search service is currently unavailable.', {
      description: 'Please try again later or try different search terms.',
      duration: 5000
    });
    return { newResults: [], hasMore: false };
  }
};
