
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

export async function getLocationCoordinates(location: string) {
  const geocodeEndpoint = 'https://maps.googleapis.com/maps/api/geocode/json';
  
  if (!GOOGLE_API_KEY) {
    throw new Error('Google Places API key is not configured');
  }
  
  try {
    console.log('Geocoding location:', location);
    
    const response = await fetch(
      `${geocodeEndpoint}?address=${encodeURIComponent(location)}&key=${GOOGLE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    console.log('Geocoding response:', data);
    
    if (data.status === 'ZERO_RESULTS') {
      throw new Error('No location found for the given address');
    }
    
    if (data.status !== 'OK') {
      throw new Error(`Geocoding error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    if (!data.results?.[0]?.geometry?.location) {
      throw new Error('Location data not found in response');
    }

    console.log('Found coordinates:', data.results[0].geometry.location);
    return data.results[0].geometry.location;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

export async function getPlaceDetails(placeId: string) {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google Places API key is not configured');
  }

  const detailsEndpoint = 'https://maps.googleapis.com/maps/api/place/details/json';
  const detailsParams = new URLSearchParams({
    place_id: placeId,
    fields: 'website,formatted_phone_number,formatted_address,url',
    key: GOOGLE_API_KEY
  });

  try {
    const detailsResponse = await fetch(`${detailsEndpoint}?${detailsParams}`);
    
    if (!detailsResponse.ok) {
      throw new Error(`Place details API error: ${detailsResponse.status} - ${await detailsResponse.text()}`);
    }

    const data = await detailsResponse.json();
    console.log('Place details response:', data);
    
    if (data.status !== 'OK') {
      throw new Error(`Place details error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
    
    return data;
  } catch (error) {
    console.error('Place details error:', error);
    throw error;
  }
}

export async function searchNearbyPlaces(locationQuery: string, location: { lat: number; lng: number }) {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google Places API key is not configured');
  }

  const placesEndpoint = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
  const searchParams = new URLSearchParams({
    query: locationQuery,
    location: `${location.lat},${location.lng}`,
    radius: '80000', // 50 miles in meters
    type: 'establishment',
    key: GOOGLE_API_KEY
  });

  try {
    console.log('Searching with params:', searchParams.toString());
    const response = await fetch(`${placesEndpoint}?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`Places API error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    console.log('Places API response:', data);

    if (data.status === 'ZERO_RESULTS') {
      return { results: [], status: 'OK' };
    }

    if (data.status !== 'OK') {
      throw new Error(`Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    console.error('Places API error:', error);
    throw error;
  }
}
