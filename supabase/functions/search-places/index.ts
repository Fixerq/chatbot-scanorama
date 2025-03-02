
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

// Country code mapping for common countries
const COUNTRY_CODES: Record<string, string> = {
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

// Rough center points for regions to improve search accuracy
const REGION_CENTERS: Record<string, LocationCoordinates> = {
  // US States
  "California": { latitude: 36.7783, longitude: -119.4179 },
  "New York": { latitude: 40.7128, longitude: -74.0060 },
  "Texas": { latitude: 31.9686, longitude: -99.9018 },
  // UK
  "England": { latitude: 52.3555, longitude: -1.1743 },
  "Scotland": { latitude: 56.4907, longitude: -4.2026 },
  // Add more as needed
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Google Places API key from environment variables
    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
    
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('Missing Google Places API key');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error: Missing API key',
          detail: 'The GOOGLE_PLACES_API_KEY environment variable is not set'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Validate request body exists
    if (req.body === null) {
      console.error('Request body is missing');
      return new Response(
        JSON.stringify({ error: 'Request body is missing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Parse request body with error handling
    let requestData: SearchRequest;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error('Error parsing request body:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid request format', details: e.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { query, country, region, startIndex = 0, limit = 10, include_details = false } = requestData;

    if (!query) {
      console.error('Missing required parameter: query');
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: query' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Searching for: "${query}" in ${region || ''} ${country || ''}, startIndex: ${startIndex}`);

    // URL for the Google Places API Text Search endpoint
    const searchUrl = `https://places.googleapis.com/v1/places:searchText`;

    // Build location bias and restriction based on country and region
    let locationBias = {};
    let locationRestriction = {};

    if (country) {
      // Get country code from mapping or attempt to derive it
      let countryCode = COUNTRY_CODES[country];
      
      if (!countryCode && country) {
        // Fallback: try to extract country code (not reliable for all countries)
        try {
          countryCode = country.substring(0, 2).toUpperCase();
          console.log(`Using derived country code: ${countryCode} for ${country}`);
        } catch (e) {
          console.warn('Could not derive country code from:', country);
        }
      }

      // Set country restriction if we have a valid code
      if (countryCode) {
        locationRestriction = { 
          includedCountries: [countryCode] 
        };
        console.log(`Set location restriction to country: ${countryCode}`);
      } else {
        // Fallback to global search with a wide rectangle
        locationRestriction = {
          rectangle: {
            low: { latitude: -90, longitude: -180 },
            high: { latitude: 90, longitude: 180 }
          }
        };
        console.log('Using global location restriction (no valid country code)');
      }

      // If region is provided, add region bias
      if (region) {
        // Try to get center coordinates for this region
        const regionCenter = REGION_CENTERS[region];
        
        if (regionCenter) {
          locationBias = {
            circle: {
              center: regionCenter,
              radius: 50000.0 // 50km radius
            }
          };
          console.log(`Using predefined center for ${region}: ${JSON.stringify(regionCenter)}`);
        } else {
          // If no predefined center, use general bias (less accurate)
          locationBias = {
            rectangle: {
              low: { latitude: -90, longitude: -180 },
              high: { latitude: 90, longitude: 180 }
            }
          };
          console.log(`No predefined center for ${region}, using global bias`);
        }
      }
    }

    // Request body for the Places API
    const searchBody = {
      textQuery: query,
      locationBias: Object.keys(locationBias).length > 0 ? locationBias : undefined,
      locationRestriction: Object.keys(locationRestriction).length > 0 ? locationRestriction : undefined,
      maxResultCount: limit,
      languageCode: "en"
    };

    // Define the fields we want to retrieve
    const fieldMask = include_details 
      ? "places.displayName,places.formattedAddress,places.websiteUri,places.id,places.location,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.regularOpeningHours,places.priceLevel,places.types,places.photos"
      : "places.displayName,places.formattedAddress,places.websiteUri,places.id";

    console.log('Search request:', JSON.stringify({
      url: searchUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': 'API_KEY_EXISTS: ' + (GOOGLE_PLACES_API_KEY ? 'Yes' : 'No'),
        'X-Goog-FieldMask': fieldMask
      },
      body: JSON.stringify(searchBody)
    }));

    // Make the API call to Google Places
    let response;
    try {
      response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': fieldMask,
        },
        body: JSON.stringify(searchBody)
      });
    } catch (fetchError) {
      console.error('Network error during Google Places API call:', fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Network error connecting to Google Places API', 
          details: fetchError.message,
          status: 'connection_error'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
      );
    }

    // Handle API response
    if (!response.ok) {
      let errorText;
      let errorData;
      
      try {
        errorText = await response.text();
        try {
          // Try to parse as JSON if possible
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Not JSON, use as text
          errorData = { message: errorText };
        }
      } catch (e) {
        errorText = 'Could not read error response';
        errorData = { message: errorText };
      }
      
      console.error(`Google Places API error (${response.status}): ${errorText}`);
      
      // Provide more details about the error
      return new Response(
        JSON.stringify({ 
          error: `Google Places API error: ${response.status}`, 
          details: errorData,
          request: {
            query,
            country,
            region
          },
          status: 'api_error'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    // Parse successful response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Error parsing Google Places API response:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Error parsing Google Places API response', 
          details: parseError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    console.log(`Received ${data.places?.length || 0} places from Google API`);

    // Check for valid data structure
    if (!data.places || !Array.isArray(data.places)) {
      console.warn('Google Places API returned an unexpected format:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response format from Google Places API',
          details: 'The "places" property is missing or not an array',
          rawResponse: data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Process the results
    const results = data.places
      .filter(place => !!place.websiteUri)  // Only include places with websites
      .map(place => {
        console.log(`Processing place: ${place.displayName?.text || 'Unknown'}`);
        
        // Extract the basic information
        const result = {
          url: place.websiteUri,
          title: place.displayName?.text || 'Business Name Not Available',
          description: place.formattedAddress || '',
          details: {
            title: place.displayName?.text || 'Business Name Not Available',
            description: place.formattedAddress || '',
            lastChecked: new Date().toISOString(),
          }
        };

        // Add additional details if requested
        if (include_details) {
          result.details = {
            ...result.details,
            phone: place.nationalPhoneNumber,
            rating: place.rating,
            reviewCount: place.userRatingCount,
            businessType: place.types?.[0] || '',
            priceLevel: place.priceLevel,
            location: place.location ? `${place.location.latitude},${place.location.longitude}` : null,
            openingHours: place.regularOpeningHours?.periods?.map(period => ({
              open: period.open?.day + ':' + period.open?.hour + ':' + period.open?.minute,
              close: period.close?.day + ':' + period.close?.hour + ':' + period.close?.minute,
            })) || []
          };
        }

        return result;
      });

    // Check if there are more results available (pagination token)
    const hasMore = !!data.nextPageToken;

    return new Response(
      JSON.stringify({ 
        results, 
        hasMore,
        totalResults: results.length,
        nextPageToken: data.nextPageToken
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
