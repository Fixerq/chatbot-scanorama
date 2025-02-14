
import { SearchResult } from './types.ts';
import { getCachedResults, cacheResults } from './cacheService.ts';
import { validateSearchRequest } from './validation.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getPlaceDetails } from './placesApi.ts';

export async function searchBusinesses(params: {
  query: string;
  country: string;
  region: string;
  nextPageToken?: string;
}, supabase: ReturnType<typeof createClient>) {
  try {
    console.log('Starting business search with params:', params);

    // Check cache first if this is a new search (no nextPageToken)
    if (!params.nextPageToken) {
      const cachedResults = await getCachedResults(
        params.query,
        params.country,
        params.region
      );

      if (cachedResults) {
        console.log('Using cached results');
        return {
          results: cachedResults.results,
          hasMore: cachedResults.hasMore,
          nextPageToken: cachedResults.nextPageToken,
          searchBatchId: crypto.randomUUID()
        };
      }
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error('Missing Google Places API key');
      throw new Error('Server configuration error');
    }

    const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    const encodedQuery = encodeURIComponent(params.query);
    let url = `${baseUrl}?query=${encodedQuery}&key=${apiKey}&language=en`;

    if (params.country) {
      url += `&region=${params.country}`;
    }
    if (params.region) {
      url += `&region=${params.region}`;
    }
    if (params.nextPageToken) {
      url += `&pagetoken=${params.nextPageToken}`;
    }

    console.log('Fetching URL:', url);
    const apiResponse = await fetch(url);

    if (!apiResponse.ok) {
      console.error('Google Places API error:', apiResponse.status, apiResponse.statusText);
      throw new Error(`Google Places API error: ${apiResponse.statusText}`);
    }

    const data = await apiResponse.json();
    console.log('Google Places API response:', data);

    if (!data.results) {
      console.warn('No results found in Google Places API response');
      return {
        results: [],
        hasMore: false,
        nextPageToken: undefined,
        searchBatchId: crypto.randomUUID()
      };
    }

    // Process each result to include website details
    const resultsWithDetails = await Promise.all(
      data.results.map(async (place: any) => {
        try {
          // Get additional place details including website
          if (place.place_id) {
            const details = await getPlaceDetails(place.place_id);
            return {
              title: place.name,
              description: place.formatted_address,
              url: details?.website || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
              details: {
                title: place.name,
                description: place.formatted_address,
                address: place.formatted_address,
                businessType: place.types ? place.types.join(', ') : 'Unknown',
                placeId: place.place_id,
                website_url: details?.website,
                business_name: place.name
              }
            };
          }
          return {
            title: place.name,
            description: place.formatted_address,
            url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            details: {
              title: place.name,
              description: place.formatted_address,
              address: place.formatted_address,
              businessType: place.types ? place.types.join(', ') : 'Unknown',
              placeId: place.place_id,
              business_name: place.name
            }
          };
        } catch (error) {
          console.error('Error processing place details:', error);
          return null;
        }
      })
    );

    // Filter out null results and format them
    const results = resultsWithDetails
      .filter((result): result is SearchResult => result !== null);

    const hasMore = !!data.next_page_token;
    const nextPageToken = data.next_page_token;

    // Cache results if this is a new search
    if (!params.nextPageToken) {
      await cacheResults(params.query, params.country, params.region, {
        results,
        hasMore,
        nextPageToken
      });
    }

    return {
      results,
      hasMore,
      nextPageToken,
      searchBatchId: crypto.randomUUID()
    };
  } catch (error) {
    console.error('Error in business search:', error);
    throw error;
  }
}
