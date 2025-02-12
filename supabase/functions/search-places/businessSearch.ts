
import { getLocationCoordinates, searchNearbyPlaces, getPlaceDetails } from './placesApi.ts';
import { SearchParams, SearchResponse } from './types.ts';

export async function searchBusinesses(params: SearchParams): Promise<SearchResponse> {
  console.log('Starting business search with params:', params);

  const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!GOOGLE_API_KEY) {
    console.error('Missing Google Places API configuration');
    throw new Error('Google Places API key is not configured');
  }

  try {
    // Get coordinates for the location
    const location = await getLocationCoordinates(`${params.query} in ${params.region}, ${params.country}`);
    if (!location) {
      console.log('No location found for the search parameters');
      return {
        results: [],
        hasMore: false,
        searchBatchId: crypto.randomUUID()
      };
    }
    console.log('Location coordinates found:', location);

    // Search for places
    const placesData = await searchNearbyPlaces(`${params.query} in ${params.region}`, location);
    if (!placesData || !placesData.results || placesData.results.length === 0) {
      console.log('No places found for the search parameters');
      return {
        results: [],
        hasMore: false,
        searchBatchId: crypto.randomUUID()
      };
    }

    console.log('Places API Response:', {
      totalResults: placesData.results.length,
      hasNextPage: !!placesData.next_page_token,
      status: placesData.status
    });

    console.log(`Found ${placesData.results.length} initial results`);
    console.log('Initial results details:', placesData.results.map(place => ({
      name: place.name,
      address: place.formatted_address,
      types: place.types,
      business_status: place.business_status
    })));

    // Filter results to ensure they're businesses
    const filteredResults = placesData.results.filter(place => 
      place.business_status === 'OPERATIONAL' &&
      !place.types?.includes('locality') &&
      !place.types?.includes('political')
    );

    console.log(`Filtered to ${filteredResults.length} valid businesses`);
    console.log('Filtered businesses details:', filteredResults.map(place => ({
      name: place.name,
      address: place.formatted_address,
      types: place.types,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total
    })));

    // Log information about result limiting
    console.log('Result processing info:', {
      totalResultsAvailable: filteredResults.length,
      processingLimit: 20,
      limitingReason: 'API rate limits and cost optimization',
      hasMoreResults: filteredResults.length > 20 || !!placesData.next_page_token
    });

    // Get detailed information for each place
    const detailedResults = await Promise.all(
      filteredResults.slice(0, 20).map(async (place) => {
        try {
          const detailsData = await getPlaceDetails(place.place_id);
          if (!detailsData?.result) {
            console.log(`No valid details found for place: ${place.place_id}`);
            return null;
          }

          console.log(`Details retrieved for ${place.name}:`, {
            has_website: !!detailsData.result.website,
            has_phone: !!detailsData.result.formatted_phone_number,
            address_match: detailsData.result.formatted_address === place.formatted_address
          });

          return {
            url: detailsData.result.website || detailsData.result.url || '',
            details: {
              title: place.name,
              description: place.formatted_address,
              lastChecked: new Date().toISOString(),
              address: detailsData.result.formatted_address || place.formatted_address,
              businessType: place.types?.[0] || 'business',
              phoneNumber: detailsData.result.formatted_phone_number
            }
          };
        } catch (error) {
          console.error(`Error fetching details for place ${place.place_id}:`, error);
          return null;
        }
      })
    );

    const validResults = detailedResults.filter((result): result is NonNullable<typeof result> => result !== null);
    console.log(`Successfully processed ${validResults.length} businesses with details`);
    console.log('Final results summary:', validResults.map(result => ({
      title: result.details.title,
      has_url: !!result.url,
      has_phone: !!result.details.phoneNumber,
      business_type: result.details.businessType
    })));

    const hasMore = filteredResults.length > 20 || !!placesData.next_page_token;
    console.log('Search completion status:', {
      processedResults: validResults.length,
      totalAvailable: filteredResults.length,
      hasMore,
      hasNextPageToken: !!placesData.next_page_token
    });

    return {
      results: validResults,
      hasMore,
      searchBatchId: crypto.randomUUID()
    };
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}
