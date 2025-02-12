
import { PlaceDetails } from '../types.ts';

export async function getBusinessWebsite(placeId: string): Promise<PlaceDetails> {
  console.log('Fetching place details for:', placeId);
  const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
  
  if (!GOOGLE_API_KEY) {
    console.error('Missing Google Places API Key');
    throw new Error('Google Places API Key not configured');
  }

  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=website,formatted_phone_number,formatted_address,name&key=${GOOGLE_API_KEY}`;
  
  try {
    const response = await fetch(detailsUrl);
    if (!response.ok) {
      throw new Error(`Google Places API returned status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Google Places API response:', data);
    
    if (!data.result) {
      throw new Error('No result found in Places API response');
    }
    
    return {
      website: data.result.website || null,
      phone: data.result.formatted_phone_number || null,
      address: data.result.formatted_address || null,
      business_name: data.result.name || null
    };
  } catch (error) {
    console.error('Error fetching place details:', error);
    throw new Error(`Failed to fetch place details: ${error.message}`);
  }
}

