import { SearchResult } from './types.ts';
import { MAX_RESULTS } from './constants.ts';

export async function searchPlaces(
  query: string,
  coordinates: { lat: number, lng: number },
  radiusMeters: number,
  apiKey: string
): Promise<{ results: SearchResult[], hasMore: boolean }> {
  const searchUrl = 'https://places.googleapis.com/v1/places:searchText';
  
  console.log('Making Places API request with query:', query);

  const searchResponse = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.types',
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: MAX_RESULTS,
      locationBias: {
        circle: {
          center: { latitude: coordinates.lat, longitude: coordinates.lng },
          radius: radiusMeters,
        },
      },
    })
  });

  if (!searchResponse.ok) {
    const errorText = await searchResponse.text();
    console.error('Places API error:', {
      status: searchResponse.status,
      statusText: searchResponse.statusText,
      error: errorText
    });
    throw new Error('Places API request failed');
  }

  const searchData = await searchResponse.json();
  console.log('Places API response:', JSON.stringify(searchData, null, 2));
  
  if (!searchData.places) {
    console.log('No places found in the response');
    return { results: [], hasMore: false };
  }

  const results = searchData.places
    .filter((place: any) => {
      const hasWebsite = !!place.websiteUri;
      const isBusinessType = place.types?.some((type: string) => 
        ['establishment', 'business', 'store', 'service'].includes(type)
      );
      return hasWebsite && isBusinessType;
    })
    .map((place: any) => ({
      url: place.websiteUri,
      details: {
        title: place.displayName?.text || '',
        description: place.formattedAddress || '',
        lastChecked: new Date().toISOString()
      }
    }));

  return {
    results,
    hasMore: searchData.places.length >= MAX_RESULTS
  };
}
