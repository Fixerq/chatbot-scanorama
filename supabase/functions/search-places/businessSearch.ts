
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

    // Filter results to ensure they're businesses and limit to 20
    const filteredResults = placesData.results
      .filter(place => 
        place.business_status === 'OPERATIONAL' &&
        !place.types?.includes('locality') &&
        !place.types?.includes('political')
      )
      .slice(0, 20);

    console.log(`Processing ${filteredResults.length} filtered results`);

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
              status: 'Analyzing...',
              details: {
                business_name: cachedData.business_name || place.name,
                title: place.name,
                description: cachedData.description,
                lastChecked: new Date().toISOString(),
                address: cachedData.address,
                businessType: cachedData.businessType,
                phoneNumber: cachedData.phoneNumber,
                placeId: place.place_id,
                website_url: cachedData.url,
                chatSolutions: []
              }
            };
          }

          // If not in cache, fetch from API
          const detailsData = await getPlaceDetails(place.place_id);
          console.log('Place details:', detailsData?.result);
          
          if (!detailsData?.result) {
            console.log(`No valid details found for place: ${place.place_id}`);
            return null;
          }

          const website = detailsData.result.website || detailsData.result.url || 
                         `https://maps.google.com/?q=${encodeURIComponent(place.name)}`;
          
          return {
            url: website,
            status: 'Analyzing...',
            details: {
              business_name: detailsData.result.name, // Use the name from the detailed response
              title: detailsData.result.name,
              description: detailsData.result.formatted_address || place.formatted_address,
              lastChecked: new Date().toISOString(),
              address: detailsData.result.formatted_address || place.formatted_address,
              businessType: place.types?.[0] || 'business',
              phoneNumber: detailsData.result.formatted_phone_number,
              placeId: place.place_id,
              website_url: website,
              chatSolutions: []
            }
          };
        } catch (error) {
          console.error(`Error fetching details for place ${place.place_id}:`, error);
          return null;
        }
      })
    );

    const validResults = detailedResults.filter((result): result is NonNullable<typeof result> => 
      result !== null && result.details.business_name !== undefined
    );
    
    console.log(`Successfully processed ${validResults.length} businesses with details`);
    console.log('Sample result:', validResults[0]);

    // Cache the valid results
    const cachePromises = validResults.map(result => 
      supabaseClient
        .from('cached_places')
        .upsert({
          place_id: result.details.placeId,
          search_batch_id: searchBatchId,
          place_data: {
            url: result.url,
            title: result.details.title,
            business_name: result.details.business_name,
            description: result.details.description,
            address: result.details.address,
            businessType: result.details.businessType,
            phoneNumber: result.details.phoneNumber
          },
          last_accessed: new Date().toISOString()
        })
    );

    await Promise.all(cachePromises);
    console.log('Successfully cached place details');

    return {
      results: validResults,
      hasMore: false,
      searchBatchId
    };
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}
