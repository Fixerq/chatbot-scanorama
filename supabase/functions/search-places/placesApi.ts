
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

export async function getLocationCoordinates(location: string) {
  const geocodeEndpoint = 'https://maps.googleapis.com/maps/api/geocode/json';
  
  try {
    console.log('Geocoding location:', location);
    
    const response = await fetch(
      `${geocodeEndpoint}?address=${encodeURIComponent(location)}&key=${GOOGLE_API_KEY}`
    );
    const data = await response.json();
    console.log('Geocoding response status:', data.status);
    
    if (data.results?.[0]?.geometry?.location) {
      console.log('Found coordinates:', data.results[0].geometry.location);
      return data.results[0].geometry.location;
    }
    throw new Error(`Location not found for: ${location}`);
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

export async function getPlaceDetails(placeId: string) {
  const detailsEndpoint = 'https://maps.googleapis.com/maps/api/place/details/json';
  const detailsParams = new URLSearchParams({
    place_id: placeId,
    fields: 'website,formatted_phone_number,formatted_address,url',
    key: GOOGLE_API_KEY
  });

  const detailsResponse = await fetch(`${detailsEndpoint}?${detailsParams}`);
  const data = await detailsResponse.json();
  
  if (data.status !== 'OK') {
    console.error('Place details error:', data);
    throw new Error(`Place details error: ${data.status}`);
  }
  
  return data;
}

export async function searchNearbyPlaces(locationQuery: string, location: { lat: number; lng: number }) {
  const placesEndpoint = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
  const searchParams = new URLSearchParams({
    query: locationQuery,
    location: `${location.lat},${location.lng}`,
    radius: '80000', // 50 miles in meters
    type: 'establishment',
    key: GOOGLE_API_KEY
  });

  console.log('Searching with URL:', `${placesEndpoint}?${searchParams}`);
  const response = await fetch(`${placesEndpoint}?${searchParams}`);
  const data = await response.json();
  console.log('Places API response status:', data.status);

  if (data.status !== 'OK') {
    throw new Error(`Places API error: ${data.status}`);
  }

  return data;
}
