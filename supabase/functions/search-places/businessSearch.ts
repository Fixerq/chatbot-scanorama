
import { getLocationCoordinates, searchNearbyPlaces, getPlaceDetails } from './placesApi.ts';
import { SearchParams, SearchResponse } from './types.ts';

export async function searchBusinesses(params: SearchParams): Promise<SearchResponse> {
  console.log('Search params:', JSON.stringify(params));

  const GOOGLE_API_KEY = Deno.env.get('Google API');
  if (!GOOGLE_API_KEY) {
    console.error('Missing Google API configuration');
    throw new Error('API configuration missing');
  }

  if (!params.region) {
    throw new Error('Region is required for local business search');
  }

  try {
    // Get coordinates for the location
    const location = await getLocationCoordinates(`${params.query} in ${params.region}, ${params.country}`);
    console.log('Location coordinates:', location);

    const data = await searchNearbyPlaces(`${params.query} in ${params.region}`, location);
    console.log(`Found ${data.results.length} places`);

    // Filter results to ensure they're businesses
    const filteredResults = data.results.filter(place => 
      place.business_status === 'OPERATIONAL' &&
      !place.types.includes('locality') &&
      !place.types.includes('political')
    );

    console.log(`Filtered to ${filteredResults.length} valid businesses`);

    // Get detailed information for each place
    const detailedResults = await Promise.all(
      filteredResults.slice(0, 20).map(async (place) => {
        try {
          const detailsData = await getPlaceDetails(place.place_id);

          return {
            url: detailsData.result?.website || '',
            details: {
              title: place.name,
              description: `${place.name} - ${place.formatted_address}`,
              lastChecked: new Date().toISOString(),
              address: detailsData.result?.formatted_address || place.formatted_address,
              businessType: place.types[0] || 'business'
            }
          };
        } catch (error) {
          console.error('Error fetching place details:', error);
          return null;
        }
      })
    );

    const validResults = detailedResults.filter(Boolean);
    console.log(`Found ${validResults.length} valid business results`);

    const searchBatchId = crypto.randomUUID();

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
