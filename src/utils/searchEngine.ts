
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';

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
    console.log('Performing Places search with params:', {
      query,
      country,
      region,
      startIndex
    });

    // Create a more reliable search query by adding the region/country if not already in query
    let enhancedQuery = query;
    if (region && !query.toLowerCase().includes(region.toLowerCase())) {
      enhancedQuery = `${query} ${region}`;
    }
    if (country && !query.toLowerCase().includes(country.toLowerCase())) {
      enhancedQuery = `${enhancedQuery} ${country}`;
    }

    const { data, error } = await supabase.functions.invoke('search-places', {
      body: {
        query: enhancedQuery,
        country,
        region,
        startIndex: startIndex || 0,
        limit: 10, // Ensure we're requesting a consistent amount of results
        include_details: true // Request additional details for better verification
      }
    });

    if (error) {
      console.error('Places search error:', error);
      
      // Attempt a second search with a simplified query if there was an error
      console.log('Attempting fallback search with simplified parameters...');
      const fallbackQuery = query.split(' ')[0]; // Use just the first word of the query
      
      const fallbackResponse = await supabase.functions.invoke('search-places', {
        body: {
          query: fallbackQuery,
          country,
          startIndex: 0,
          limit: 10,
          include_details: true
        }
      });
      
      if (fallbackResponse.error) {
        console.error('Fallback search also failed:', fallbackResponse.error);
        return {
          results: [],
          hasMore: false
        };
      }
      
      // Use the fallback data instead of trying to reassign the const 'data'
      return processSearchResults(fallbackResponse.data);
    }

    console.log('Raw response from Edge Function:', data);
    return processSearchResults(data);
    
  } catch (error) {
    console.error('Places search error:', error);
    // Return empty results instead of null to avoid breaking the UI
    return {
      results: [],
      hasMore: false
    };
  }
};

// Helper function to process search results
const processSearchResults = (data: any): PlacesResult => {
  if (!data || !data.results || !Array.isArray(data.results)) {
    console.error('Invalid response format or empty results:', data);
    return {
      results: [],
      hasMore: false
    };
  }

  // Map the results to the expected format and ensure there are no undefined entries
  const formattedResults = data.results
    .filter((result: any) => result && result.url) // Only include results with URLs
    .map((result: any) => ({
      url: result.url,
      status: 'Ready for analysis',
      details: {
        title: result.details?.title || result.title || '',
        description: result.details?.description || result.description || '',
        lastChecked: new Date().toISOString(),
        // Include additional details if available
        phone: result.details?.phone,
        rating: result.details?.rating,
        reviewCount: result.details?.reviewCount
      }
    }));

  console.log('Formatted results count:', formattedResults.length);
  if (formattedResults.length > 0) {
    console.log('Sample formatted result:', formattedResults[0]);
  }

  return {
    results: formattedResults,
    hasMore: data.hasMore || false
  };
}
