
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.1.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')

interface SearchOptions {
  query: string;
  country?: string;
  region?: string;
  startIndex?: number;
  limit?: number;
  include_details?: boolean;
}

interface SearchResponse {
  results: any[];
  hasMore: boolean;
  error?: string;
  details?: string;
  status?: string;
}

// Country code mappings for the Google Places API
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
  "Sweden": "SE",
  "Mexico": "MX",
  "South Africa": "ZA",
  "South Korea": "KR",
  "Russia": "RU",
  "United Arab Emirates": "AE",
  "New Zealand": "NZ",
  "Ireland": "IE",
  "Switzerland": "CH",
  "Norway": "NO",
  "Denmark": "DK",
  "Finland": "FI",
  "Belgium": "BE",
  "Austria": "AT",
  "Portugal": "PT",
  "Greece": "GR"
};

// Map for approximate region center coordinates
// This is a simplified approach. In a production app, you might want to use a geocoding service.
const REGION_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  // US States (major ones)
  "California": { latitude: 36.7783, longitude: -119.4179 },
  "New York": { latitude: 40.7128, longitude: -74.0060 },
  "Texas": { latitude: 31.9686, longitude: -99.9018 },
  "Florida": { latitude: 27.6648, longitude: -81.5158 },
  // UK
  "England": { latitude: 52.3555, longitude: -1.1743 },
  "Scotland": { latitude: 56.4907, longitude: -4.2026 },
  "Wales": { latitude: 52.1307, longitude: -3.7837 },
  // Default fallback
  "default": { latitude: 0, longitude: 0 }
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Search-places function invoked`);
  
  try {
    if (!GOOGLE_API_KEY) {
      console.error('GOOGLE_PLACES_API_KEY is not set in environment variables');
      return new Response(
        JSON.stringify({
          error: 'API key configuration error',
          details: 'Google Places API key is not configured',
          status: 'config_error'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Parse request body
    const options: SearchOptions = await req.json();
    const { query, country, region, startIndex = 0, limit = 10, include_details = false } = options;
    
    console.log('[REQUEST] Search request received:', {
      query, 
      country, 
      region, 
      startIndex,
      limit
    });

    if (!query) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters',
          details: 'Query parameter is required',
          status: 'invalid_params'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Prepare the Google Places API request
    const apiUrl = 'https://places.googleapis.com/v1/places:searchText';
    
    // Build the request body with proper formatting for Google Places API v1
    const requestBody: any = {
      textQuery: query,
      maxResultCount: limit,
      languageCode: "en",
    };

    // Add region code for country-level filtering if available
    if (country && COUNTRY_CODES[country]) {
      requestBody.regionCode = COUNTRY_CODES[country];
      console.log(`[CONFIG] Using region code ${requestBody.regionCode} for country ${country}`);
    }

    // Add location bias based on region and country
    if (region) {
      const regionCoords = REGION_COORDINATES[region] || REGION_COORDINATES.default;
      
      // If we have specific coordinates for this region, use a circle bias
      if (regionCoords !== REGION_COORDINATES.default) {
        requestBody.locationBias = {
          circle: {
            center: {
              latitude: regionCoords.latitude,
              longitude: regionCoords.longitude
            },
            radius: 50000 // 50km radius to cover most metropolitan areas
          }
        };
        console.log(`[CONFIG] Using location bias with region coordinates: ${JSON.stringify(regionCoords)}`);
      } else {
        console.log(`[CONFIG] No specific coordinates found for region: ${region}, using default bias`);
      }
    }

    console.log('[API] Request body:', JSON.stringify(requestBody, null, 2));

    // Define comprehensive field mask for more detailed results
    const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.websiteUri,' +
                      'places.rating,places.userRatingCount,places.types,places.priceLevel,' + 
                      'places.regularOpeningHours,places.photos,places.internationalPhoneNumber,' +
                      'places.businessStatus';
    
    console.log('[API] Using field mask:', fieldMask);

    // Make the API request with expanded field mask
    const requestStartTime = Date.now();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': fieldMask
      },
      body: JSON.stringify(requestBody)
    });
    const requestDuration = Date.now() - requestStartTime;
    console.log(`[API] Request completed in ${requestDuration}ms with status: ${response.status}`);
    
    // Log response headers for debugging rate limits
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('[API] Response headers:', JSON.stringify(headers, null, 2));

    // Handle rate limiting explicitly
    if (response.status === 429) {
      console.error('[ERROR] Rate limit exceeded on Google Places API');
      const retryAfter = response.headers.get('Retry-After') || '60';
      
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          details: `Please retry after ${retryAfter} seconds`,
          status: 'rate_limited',
          retryAfter: parseInt(retryAfter, 10)
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429
        }
      );
    }

    // Parse the response
    const responseData = await response.json();
    console.log('[API] Full response data:', JSON.stringify(responseData, null, 2));
    
    if (!response.ok) {
      console.error('[ERROR] Google Places API error:', response.status, responseData);
      
      return new Response(
        JSON.stringify({
          error: `Google Places API error (${response.status})`,
          details: responseData?.error?.message || 'Unknown error',
          status: 'api_error'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    console.log(`[PROCESSING] Found ${responseData.places?.length || 0} places in response`);
    
    // Process the results with enhanced details
    const results = (responseData.places || []).map((place: any, index: number) => {
      const website = place.websiteUri || '';
      const phoneNumber = place.internationalPhoneNumber || '';
      
      console.log(`[PROCESSING] Processing place ${index + 1}: ${place.displayName?.text || 'Unknown'}`);
      
      // Skip entries without a website
      if (!website) {
        console.log(`[PROCESSING] No website for place: ${place.displayName?.text || 'Unknown'}`);
        return {
          url: 'https://example.com/no-website',
          title: place.displayName?.text || 'Unknown Business',
          description: place.formattedAddress || '',
          details: {
            title: place.displayName?.text || 'Unknown Business',
            description: place.formattedAddress || '',
            phone: phoneNumber,
            rating: place.rating || 0,
            reviewCount: place.userRatingCount || 0,
            businessType: (place.types || [])[0] || '',
            priceLevel: place.priceLevel || 0,
            openingHours: processOpeningHours(place.regularOpeningHours),
            location: place.formattedAddress || '',
            photoReference: place.photos?.[0]?.name || ''
          }
        };
      }
      
      return {
        url: website,
        title: place.displayName?.text || 'Unknown Business',
        description: place.formattedAddress || '',
        details: {
          title: place.displayName?.text || 'Unknown Business',
          description: place.formattedAddress || '',
          phone: phoneNumber,
          rating: place.rating || 0,
          reviewCount: place.userRatingCount || 0,
          businessType: (place.types || [])[0] || '',
          priceLevel: place.priceLevel || 0,
          openingHours: processOpeningHours(place.regularOpeningHours),
          location: place.formattedAddress || '',
          photoReference: place.photos?.[0]?.name || ''
        }
      };
    }).filter(Boolean);

    // Helper function to process opening hours in a more readable format
    function processOpeningHours(openingHours: any) {
      if (!openingHours || !openingHours.periods) return [];
      
      return openingHours.periods.map((p: any) => {
        if (!p.open || !p.close) return null;
        
        // Convert day numbers to day names
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const openDay = days[p.open.day] || `Day ${p.open.day}`;
        const closeDay = days[p.close.day] || `Day ${p.close.day}`;
        
        return {
          open: `${openDay} ${p.open.hour || 0}:${p.open.minute || '00'}`,
          close: `${closeDay} ${p.close.hour || 0}:${p.close.minute || '00'}`
        };
      }).filter(Boolean);
    }

    // Calculate if there might be more results
    const hasMore = results.length >= limit;
    console.log(`[RESULT] Processed ${results.length} results, hasMore=${hasMore}`);
    
    // Log a sample result for debugging
    if (results.length > 0) {
      console.log('[RESULT] Sample result:', JSON.stringify(results[0], null, 2));
    }

    const response_data: SearchResponse = {
      results,
      hasMore
    };

    const totalDuration = Date.now() - startTime;
    console.log(`[TIMING] Total function execution time: ${totalDuration}ms`);

    return new Response(
      JSON.stringify(response_data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('[ERROR] Exception in request processing:', error);
    console.error('[ERROR] Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        status: 'server_error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

