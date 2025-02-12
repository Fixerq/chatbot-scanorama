
import { getLocationCoordinates, searchNearbyPlaces, getPlaceDetails } from './placesApi.ts';
import { SearchParams, SearchResponse } from './types.ts';

const getCachedPlaceDetails = async (
  supabaseClient: any,
  placeId: string,
  searchBatchId: string
) => {
  const { data: cachedPlace } = await supabaseClient
    .from('cached_places')
    .select('place_data')
    .eq('place_id', placeId)
    .maybeSingle();

  if (cachedPlace) {
    // Update last_accessed timestamp
    await supabaseClient
      .from('cached_places')
      .update({ last_accessed: new Date().toISOString() })
      .eq('place_id', placeId);

    return cachedPlace.place_data;
  }

  return null;
};

export async function searchBusinesses(
  params: SearchParams,
  supabaseClient: any
): Promise<SearchResponse> {
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

    const searchBatchId = crypto.randomUUID();

    // Filter results to ensure they're businesses
    const filteredResults = placesData.results.filter(place => 
      place.business_status === 'OPERATIONAL' &&
      !place.types?.includes('locality') &&
      !place.types?.includes('political')
    );

    // Get detailed information for each place
    const detailedResults = await Promise.all(
      filteredResults.map(async (place) => {
        try {
          // Check cache first
          const cachedData = await getCachedPlaceDetails(supabaseClient, place.place_id, searchBatchId);
          if (cachedData) {
            console.log(`Using cached data for place: ${place.place_id}`);
            return {
              url: cachedData.url,
              details: {
                title: cachedData.title,
                description: cachedData.description,
                lastChecked: new Date().toISOString(),
                address: cachedData.address,
                businessType: cachedData.businessType,
                phoneNumber: cachedData.phoneNumber,
                placeId: place.place_id
              }
            };
          }

          // If not in cache, fetch from API
          const detailsData = await getPlaceDetails(place.place_id);
          if (!detailsData?.result) {
            console.log(`No valid details found for place: ${place.place_id}`);
            return null;
          }

          return {
            url: detailsData.result.website || detailsData.result.url || '',
            details: {
              title: place.name,
              description: place.formatted_address,
              lastChecked: new Date().toISOString(),
              address: detailsData.result.formatted_address || place.formatted_address,
              businessType: place.types?.[0] || 'business',
              phoneNumber: detailsData.result.formatted_phone_number,
              placeId: place.place_id
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

    const hasMore = filteredResults.length > validResults.length || !!placesData.next_page_token;

    return {
      results: validResults,
      hasMore,
      searchBatchId
    };
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}
