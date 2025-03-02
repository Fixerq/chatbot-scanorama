
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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
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
    
    console.log('Search request received:', {
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
      // Use locationBias to influence results instead of strict filtering
      // This is more reliable than trying to use locationRestriction
      languageCode: "en",
    };

    // Add location bias based on country and region
    if (country) {
      // Add region bias if available
      if (region) {
        requestBody.locationBias = {
          rectangle: {
            // Use approximate rectangle based on region
            // This is a simplified approach - in production you'd want to use actual geocoding
            low: { latitude: 0, longitude: 0 },
            high: { latitude: 90, longitude: 180 }
          }
        };
      } else {
        // Just use circle bias with center of country
        requestBody.locationBias = {
          circle: {
            center: {
              latitude: 37.0902, // Default to US center if no specific mapping
              longitude: -95.7129
            },
            radius: 2000000 // Large radius in meters (2000km)
          }
        };
      }
    }

    console.log('API request body:', JSON.stringify(requestBody, null, 2));

    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.rating,places.userRatingCount,places.types,places.priceLevel,places.regularOpeningHours'
      },
      body: JSON.stringify(requestBody)
    });

    // Parse the response
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Google Places API error:', response.status, responseData);
      
      return new Response(
        JSON.stringify({
          error: `Google Places API error (${response.status}): ${JSON.stringify(responseData, null, 2)}`,
          details: responseData?.error?.message || 'Unknown error',
          status: 'api_error'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    console.log('Google Places API response received');
    
    // Process the results
    const results = (responseData.places || []).map((place: any) => {
      const website = place.websiteUri || '';
      
      // Skip entries without a website
      if (!website) {
        return {
          url: 'https://example.com/no-website',
          title: place.displayName?.text || 'Unknown Business',
          description: place.formattedAddress || '',
          details: {
            title: place.displayName?.text || 'Unknown Business',
            description: place.formattedAddress || '',
            phone: '',
            rating: place.rating || 0,
            reviewCount: place.userRatingCount || 0,
            businessType: (place.types || [])[0] || '',
            priceLevel: place.priceLevel || 0,
            openingHours: (place.regularOpeningHours?.periods || []).map((p: any) => ({
              open: p.open?.day + ' ' + p.open?.hour + ':' + p.open?.minute,
              close: p.close?.day + ' ' + p.close?.hour + ':' + p.close?.minute,
            })),
            location: place.formattedAddress || ''
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
          phone: '',
          rating: place.rating || 0,
          reviewCount: place.userRatingCount || 0,
          businessType: (place.types || [])[0] || '',
          priceLevel: place.priceLevel || 0,
          openingHours: (place.regularOpeningHours?.periods || []).map((p: any) => ({
            open: p.open?.day + ' ' + p.open?.hour + ':' + p.open?.minute,
            close: p.close?.day + ' ' + p.close?.hour + ':' + p.close?.minute,
          })),
          location: place.formattedAddress || ''
        }
      };
    }).filter(Boolean);

    // Calculate if there might be more results
    const hasMore = results.length >= limit;

    const response_data: SearchResponse = {
      results,
      hasMore
    };

    return new Response(
      JSON.stringify(response_data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
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
