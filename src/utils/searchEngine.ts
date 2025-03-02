
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

      // Log the enhanced query for debugging
      console.log('Using enhanced search query:', enhancedQuery);

      // Attempt to call the edge function
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

        // If we get a non-200 error, retry after a delay
        if (retryCount < maxRetries - 1) {
          console.log(`Got error, retrying in ${retryDelay * (retryCount + 1)}ms... (attempt ${retryCount + 1} of ${maxRetries})`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
          continue;
        }
        
        // All retries failed
        if (error.message.includes('API key')) {
          toast.error('Google Places API key is missing or invalid. Please check your configuration.', { 
            description: 'Contact your administrator to resolve this issue.'
          });
        } else {
          toast.error('Search service is currently unavailable.', { 
            description: 'Please try again later or try a different search.'
          });
        }
        return null;
      }

      // Check for errors in the response
      if (data?.error) {
        console.error('Places search API error:', data.error);
        console.error('Error details:', data.details || 'No details provided');
        
        // If we have more retries left, try again
        if (retryCount < maxRetries - 1) {
          console.log(`Got API error, retrying in ${retryDelay * (retryCount + 1)}ms... (attempt ${retryCount + 1} of ${maxRetries})`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
          continue;
        }
        
        // All retries failed with API errors
        if (data.status === 'api_error') {
          toast.error('Error from Google Places API.', { 
            description: 'Please check your search terms and try again with a more specific location.'
          });
        } else {
          toast.error('Search service encountered an error.', { 
            description: 'Please try again later or modify your search.'
          });
        }
        return null;
      }

      console.log('Raw response from Edge Function:', data);
      return processSearchResults(data);
    } catch (error) {
      console.error('Places search error:', error);
      retryCount++;
      
      if (retryCount < maxRetries) {
        console.log(`Retrying search in ${retryDelay * retryCount}ms... (attempt ${retryCount} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
      } else {
        // All retries failed
        console.error('Search failed after maximum retries');
        toast.error('Search failed. Please try again later or refine your search criteria.');
        return null;
      }
    }
  }
  
  // If we've exhausted all retries, return null
  console.error('Search failed after maximum retries');
  toast.error('Search failed. Please try again later.');
  return null;
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
