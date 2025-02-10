
import { GeocodeResponse, GeocodeCacheEntry, Coordinates } from './types';
import { GEOCODING_CACHE_TTL } from './constants';

const geocodingCache = new Map<string, GeocodeCacheEntry>();

export function getCachedCoordinates(query: string): Coordinates | null {
  const cacheEntry = geocodingCache.get(query);
  if (cacheEntry) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - cacheEntry.timestamp < GEOCODING_CACHE_TTL) {
      return { lat: cacheEntry.lat, lng: cacheEntry.lng };
    }
    geocodingCache.delete(query);
  }
  return null;
}

export function setCachedCoordinates(query: string, lat: number, lng: number): void {
  const timestamp = Math.floor(Date.now() / 1000);
  geocodingCache.set(query, { lat, lng, timestamp });
}

export async function getCoordinates(locationQuery: string, apiKey: string): Promise<Coordinates> {
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}&key=${apiKey}`;
  console.log('Making Geocoding API request for location:', locationQuery);

  const geocodeResponse = await fetch(geocodeUrl);
  if (!geocodeResponse.ok) {
    const errorText = await geocodeResponse.text();
    console.error('Geocoding API error:', {
      status: geocodeResponse.status,
      statusText: geocodeResponse.statusText,
      error: errorText
    });
    throw new Error('Geocoding API request failed');
  }

  const geocodeData: GeocodeResponse = await geocodeResponse.json();
  if (!geocodeData.results || geocodeData.results.length === 0) {
    console.error('No geocoding results found for query:', locationQuery);
    throw new Error('No geocoding results found');
  }

  const coordinates = geocodeData.results[0].geometry.location;
  console.log('Geocoded coordinates:', coordinates);
  setCachedCoordinates(locationQuery, coordinates.lat, coordinates.lng);
  return coordinates;
}
