import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY') || Deno.env.get('Google API');
const MAX_RESULTS = 50;
const DEFAULT_RADIUS_MILES = 50;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  country: string;
  region: string;
  startIndex?: number;
  limit?: number;
  include_details?: boolean;
}

const regionCoordinates: Record<string, { lat: number; lng: number }> = {
  "Delaware": { lat: 39.0, lng: -75.5 },
  "California": { lat: 36.7, lng: -119.4 },
  "New York": { lat: 43.0, lng: -75.0 },
  "Texas": { lat: 31.0, lng: -100.0 },
  "Florida": { lat: 27.8, lng: -81.5 },
};

const getLocationBias = (country: string, region: string) => {
  if (region && regionCoordinates[region]) {
    return regionCoordinates[region];
  }
  
  return { lat: 37.0902, lng: -95.7129 };
};

const getCountryCode = (country: string): string => {
  const countryMap: Record<string, string> = {
    "United States": "US",
    "United Kingdom": "GB",
    "Canada": "CA",
    "Australia": "AU",
    "Germany": "DE",
    "France": "FR",
    "Spain": "ES",
    "Italy": "IT",
    "Japan": "JP",
    "Brazil": "BR",
    "India": "IN",
    "China": "CN",
    "Singapore": "SG",
    "Netherlands": "NL",
    "Sweden": "SE"
  };
  
  return countryMap[country] || "US";
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('Google Places API key not configured');
      throw new Error('Google Places API key is not configured. Please set the GOOGLE_PLACES_API_KEY secret.');
    }

    const { query, country, region, startIndex = 0, limit = 25, include_details = false } = await req.json() as SearchRequest;
    console.log('Received search request:', { query, country, region, startIndex, limit });

    let locationQuery = query;
    if (region && country) {
      locationQuery = `${query} in ${region}, ${country}`;
    } else if (country) {
      locationQuery = `${query} in ${country}`;
    }
    
    if (query.toLowerCase().includes('plumber')) {
      locationQuery += ' plumbing services contractors business';
    } else if (query.toLowerCase().includes('electrician')) {
      locationQuery += ' electrical services contractors business';
    }
    
    console.log('Using enhanced search query:', locationQuery);

    const locationBias = getLocationBias(country, region);
    const radiusMeters = DEFAULT_RADIUS_MILES * 1609.34;
    
    const adjustedRadius = region && ['Delaware', 'Rhode Island', 'Connecticut'].includes(region)
      ? radiusMeters * 1.5
      : radiusMeters;
    
    const countryCode = getCountryCode(country);

    const searchUrl = `https://places.googleapis.com/v1/places:searchText`;
    console.log('Making Places API request with location bias:', { lat: locationBias.lat, lng: locationBias.lng, radius: adjustedRadius });

    const requestBody = {
      textQuery: locationQuery,
      maxResultCount: MAX_RESULTS,
      languageCode: "en",
      locationBias: {
        circle: {
          center: { latitude: locationBias.lat, longitude: locationBias.lng },
          radius: adjustedRadius,
        },
      },
      locationRestriction: {
        rectangle: {
          low: { latitude: locationBias.lat - 3, longitude: locationBias.lng - 3 },
          high: { latitude: locationBias.lat + 3, longitude: locationBias.lng + 3 }
        }
      }
    };

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.types,places.businessStatus,places.primaryType,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.priceLevel',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Places API error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        error: errorText
      });
      
      console.log('Attempting fallback search with simplified parameters...');
      
      const fallbackResponse = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.types',
        },
        body: JSON.stringify({
          textQuery: query,
          maxResultCount: MAX_RESULTS,
          languageCode: "en"
        })
      });
      
      if (!fallbackResponse.ok) {
        throw new Error(`Places API request failed: ${searchResponse.statusText}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      return processSearchResults(fallbackData, include_details, startIndex, limit, corsHeaders);
    }

    const searchData = await searchResponse.json();
    return processSearchResults(searchData, include_details, startIndex, limit, corsHeaders);
  } catch (error) {
    console.error('Error in search-places function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined,
        results: [],
        hasMore: false
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});

function processSearchResults(
  searchData: any, 
  includeDetails: boolean, 
  startIndex: number, 
  limit: number,
  corsHeaders: Record<string, string>
) {
  console.log('Places API response:', {
    totalResults: searchData.places?.length || 0,
    hasPlaces: !!searchData.places,
  });

  if (!searchData.places) {
    console.log('No places found');
    return new Response(
      JSON.stringify({ 
        results: [],
        hasMore: false
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  let results = searchData.places.map((place: any) => {
    console.log(`Place ${place.displayName?.text}: hasWebsite=${!!place.websiteUri}, types=${place.types?.join(',')}`);
    
    return {
      url: place.websiteUri || '',
      details: {
        title: place.displayName?.text || '',
        description: place.formattedAddress || '',
        lastChecked: new Date().toISOString(),
        placeId: place.id,
        types: place.types,
        hasWebsite: !!place.websiteUri,
        phone: place.nationalPhoneNumber || '',
        rating: place.rating,
        reviewCount: place.userRatingCount,
        priceLevel: place.priceLevel
      }
    };
  });

  console.log(`Found ${results.length} businesses, filtering for ones with websites...`);
  
  const websiteResults = results.filter((place: any) => place.url);
  
  if (websiteResults.length > 5) {
    results = websiteResults;
    console.log(`Filtered to ${results.length} businesses with websites`);
  } else {
    results = results.map((result: any) => ({
      ...result,
      url: result.url || 'https://example.com/no-website',
      details: {
        ...result.details,
        noWebsite: !result.url
      }
    }));
    console.log(`Kept all ${results.length} businesses, some without websites`);
  }

  const paginatedResults = startIndex > 0 
    ? results.slice(startIndex, startIndex + limit)
    : results.slice(0, limit);

  return new Response(
    JSON.stringify({
      results: paginatedResults,
      hasMore: results.length > (startIndex + paginatedResults.length)
    }),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  );
}
