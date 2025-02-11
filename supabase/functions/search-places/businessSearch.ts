
import { getLocationCoordinates, searchNearbyPlaces, getPlaceDetails } from './placesApi.ts';
import { SearchParams, SearchResponse } from './types.ts';

export async function searchBusinesses(params: SearchParams): Promise<SearchResponse> {
  console.log('Search params:', JSON.stringify(params));

  const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!GOOGLE_API_KEY) {
    console.error('Missing Google Places API configuration');
    throw new Error('Google Places API key is not configured');
  }

  if (!params.region) {
    console.error('Region parameter is missing');
    throw new Error('Region is required for local business search');
  }

  try {
    // Get coordinates for the location
    const location = await getLocationCoordinates(`${params.query} in ${params.region}, ${params.country}`);
    if (!location) {
      console.error('Could not determine location coordinates');
      throw new Error('Location not found');
    }
    console.log('Location coordinates:', location);

    const data = await searchNearbyPlaces(`${params.query} in ${params.region}`, location);
    if (!data || !data.results) {
      console.error('No results from Places API');
      throw new Error('No results found');
    }
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
          if (!detailsData || !detailsData.result) {
            console.warn(`No details found for place: ${place.place_id}`);
            return null;
          }

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

    if (validResults.length === 0) {
      throw new Error('No valid business results found');
    }

    const searchBatchId = crypto.randomUUID();

    return {
      results: validResults,
      hasMore: false,
      searchBatchId
    };
  } catch (error) {
    console.error('Search error:', error);
    // Make sure to propagate the error message
    throw new Error(error instanceof Error ? error.message : 'Search failed');
  }
}
