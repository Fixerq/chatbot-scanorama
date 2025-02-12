import { getLocationCoordinates, searchNearbyPlaces, getPlaceDetails } from './placesApi.ts';
import { SearchParams, SearchResponse } from './types.ts';

const getCachedPlaceDetails = async (
  supabaseClient: any,
  placeId: string,
  searchBatchId: string
) => {
  const { data: cachedPlace } = await supabaseClient
    .from('cached_places')
    .select('place_data, business_name')
    .eq('place_id', placeId)
    .maybeSingle();

  if (cachedPlace) {
    console.log(`Found cached place data for ${placeId}:`, cachedPlace);
    // Update last_accessed timestamp
    await supabaseClient
      .from('cached_places')
      .update({ last_accessed: new Date().toISOString() })
      .eq('place_id', placeId);

    return cachedPlace;
  }

  return null;
};

const processSearchResults = async (placesData: any, searchBatchId: string) => {
  return placesData.results
    .filter((place: any) => 
      place.business_status === 'OPERATIONAL' &&
      !place.types?.includes('locality') &&
      !place.types?.includes('political')
    )
    .slice(0, 20)
    .map((result: any) => {
      const businessName = result.name;
      return {
        url: result.website || result.url || `https://maps.google.com/?q=${encodeURIComponent(result.name)}`,
        businessName: businessName,
        details: {
          business_name: businessName,
          title: businessName,
          description: result.formatted_address || result.vicinity,
          lastChecked: new Date().toISOString(),
          address: result.formatted_address || result.vicinity,
          businessType: result.types?.[0] || 'business',
          phoneNumber: result.formatted_phone_number,
          placeId: result.place_id,
          website_url: result.website || result.url,
          chatSolutions: []
        }
      };
    });
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
    const processedResults = await processSearchResults(placesData, searchBatchId);
    
    console.log('Processed results:', processedResults);
    
    return {
      results: processedResults,
      hasMore: false,
      searchBatchId
    };
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}
