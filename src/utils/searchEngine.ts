
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
  let retryCount = 0;
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second
  
  while (retryCount < maxRetries) {
    try {
      console.log('Performing Places search with params:', {
        query,
        country,
        region,
        startIndex,
        retryAttempt: retryCount
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
        
        // Log more detailed error information
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          statusCode: error.status
        });

        // If we get a 502 error, retry after a delay
        if (error.status === 502 && retryCount < maxRetries - 1) {
          console.log(`Got 502 error, retrying in ${retryDelay}ms... (attempt ${retryCount + 1} of ${maxRetries})`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
          continue;
        }
        
        // If we reached max retries or it's not a 502 error, try a fallback approach
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
          toast.error('Search service is currently unavailable, please try again later');
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
      retryCount++;
      
      if (retryCount < maxRetries) {
        console.log(`Retrying search in ${retryDelay}ms... (attempt ${retryCount} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
      } else {
        // Return empty results instead of null to avoid breaking the UI
        toast.error('Search service encountered an error, please try again later');
        return {
          results: [],
          hasMore: false
        };
      }
    }
  }
  
  // If we've exhausted all retries, return empty results
  console.error('Search failed after maximum retries');
  return {
    results: [],
    hasMore: false
  };
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
        reviewCount: result.details?.reviewCount,
        businessType: result.details?.businessType,
        priceLevel: result.details?.priceLevel,
        openingHours: result.details?.openingHours,
        location: result.details?.location
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
