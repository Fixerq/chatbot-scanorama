
import { getLocationCoordinates, getPlaceDetails, searchNearbyPlaces } from './placesApi.ts';
import { SearchParams, BusinessSearchResult } from './types.ts';

export async function searchBusinesses(params: SearchParams): Promise<BusinessSearchResult> {
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
    const locationQuery = `${params.query} in ${params.region}, ${params.country}`;
    const location = await getLocationCoordinates(locationQuery);
    console.log('Location coordinates:', location);

    const data = await searchNearbyPlaces(locationQuery, location);
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
              phone: detailsData.result?.formatted_phone_number || '',
              mapsUrl: detailsData.result?.url || '',
              types: place.types,
              rating: place.rating
            }
          };
        } catch (error) {
          console.error('Error fetching place details:', error);
          return null;
        }
      })
    );

    const validResults = detailedResults.filter(result => result !== null);
    console.log(`Found ${validResults.length} valid business results`);

    return {
      results: validResults,
      hasMore: data.next_page_token ? true : false
    };
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}
