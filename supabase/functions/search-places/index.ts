
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Define CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer, range',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface SearchOptions {
  query: string;
  country?: string;
  region?: string;
  startIndex?: number;
  limit?: number;
  include_details?: boolean;
  pageToken?: string;
  client_timestamp?: string;
}

interface SearchResponse {
  results: any[];
  hasMore: boolean;
  nextPageToken?: string;
  error?: string;
  details?: any;
}

// Country code mapping for Places API regionCode parameter
const countryCodeMap: Record<string, string> = {
  'United States': 'US',
  'United Kingdom': 'GB',
  'Canada': 'CA',
  'Australia': 'AU',
  'Germany': 'DE',
  'France': 'FR',
  'Italy': 'IT',
  'Spain': 'ES',
  'Netherlands': 'NL',
  'Brazil': 'BR',
  'Mexico': 'MX',
  'Japan': 'JP',
  'China': 'CN',
  'India': 'IN',
  'Singapore': 'SG',
  // Add more as needed
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Google API key
    const { data: secretData } = await supabase
      .from('secrets')
      .select('value')
      .eq('name', 'GOOGLE_PLACES_API_KEY')
      .single();

    if (!secretData || !secretData.value) {
      console.error('Google Places API key not found in secrets table');
      return new Response(
        JSON.stringify({
          error: 'API key not found',
          details: 'Google Places API key missing from configuration',
          status: 'config_error',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    const GOOGLE_API_KEY = secretData.value;
    
    // Parse the request body
    const options: SearchOptions = await req.json();
    const { 
      query, 
      country = '', 
      region = '', 
      startIndex = 0, 
      limit = 20, 
      pageToken, 
      client_timestamp 
    } = options;

    // Validate required parameters
    if (!query) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameter',
          details: 'Query parameter is required',
          status: 'validation_error',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log(`Processing search request for: ${query} ${country}, country: ${country}, region: ${region || 'not specified'}`);
    if (pageToken) {
      console.log(`Using pageToken for pagination: ${pageToken}`);
    }

    // Check cache first if no pageToken (pagination requests shouldn't use cache)
    if (!pageToken) {
      const cacheKey = `${query}_${country}_${region}`.toLowerCase().replace(/\s+/g, '_');
      const { data: cachedData } = await supabase
        .from('cached_places')
        .select('*')
        .eq('search_batch_id', cacheKey)
        .order('last_accessed', { ascending: false })
        .limit(1);

      if (cachedData && cachedData.length > 0) {
        const cacheEntry = cachedData[0];
        const cacheAge = new Date().getTime() - new Date(cacheEntry.last_accessed).getTime();
        const cacheValidHours = 24; // Cache valid for 24 hours
        
        if (cacheAge < cacheValidHours * 60 * 60 * 1000) {
          console.log(`Using cached results for "${query}" from ${new Date(cacheEntry.last_accessed).toISOString()}`);
          
          // Update the access timestamp
          await supabase
            .from('cached_places')
            .update({ last_accessed: new Date().toISOString() })
            .eq('id', cacheEntry.id);
          
          return new Response(
            JSON.stringify({
              results: cacheEntry.place_data.results || [],
              hasMore: !!cacheEntry.place_data.nextPageToken,
              nextPageToken: cacheEntry.place_data.nextPageToken || null,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        } else {
          console.log(`Cache expired for "${query}", fetching fresh results`);
        }
      }
    }

    // Construct Places API search request
    const placesApiUrl = 'https://places.googleapis.com/v1/places:searchText';

    // Determine the country code for regionCode parameter
    let regionCode = '';
    if (country && country.length === 2) {
      // If country is already a 2-letter code, use it directly
      regionCode = country.toUpperCase();
    } else if (country && countryCodeMap[country]) {
      // If country is a full name with a mapping, use the mapped code
      regionCode = countryCodeMap[country];
    }

    // Build the request body for the Places API
    const requestBody: any = {
      textQuery: query,
      maxResultCount: limit,
      languageCode: "en"
    };

    // Add region code if available
    if (regionCode) {
      requestBody.regionCode = regionCode;
    }

    // Add pagination token if available
    if (pageToken) {
      requestBody.pageToken = pageToken;
    }

    // Include comprehensive field masks for detailed results
    requestBody.includedTypes = ["business"];
    requestBody.strictTypeFiltering = false;
    requestBody.languageCode = "en";
    
    // Include detailed field masks
    requestBody.locationBias = {
      rectangle: {
        low: { latitude: -90, longitude: -180 },
        high: { latitude: 90, longitude: 180 }
      }
    };
    
    // Request specific fields
    requestBody.fieldMask = "places.displayName,places.formattedAddress,places.websiteUri,places.internationalPhoneNumber," +
                            "places.rating,places.userRatingCount,places.photos,places.businessStatus,places.priceLevel," +
                            "places.regularOpeningHours,places.types,places.addressComponents,places.id,places.plusCode," +
                            "places.location,places.shortFormattedAddress,places.primaryType";

    console.log('Sending Places API request with body:', JSON.stringify(requestBody, null, 2));

    // Make the request to Google Places API
    const response = await fetch(placesApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': requestBody.fieldMask,
      },
      body: JSON.stringify(requestBody),
    });

    // Parse the response
    const responseData = await response.json();

    // Handle errors from Places API
    if (!response.ok) {
      console.error('Google Places API error:', response.status, responseData);
      console.log('Request body that caused error:', JSON.stringify(requestBody, null, 2));
      
      return new Response(
        JSON.stringify({
          error: `Google Places API error (${response.status})`,
          details: responseData?.error?.message || 'Unknown error',
          status: 'api_error',
          rawResponse: responseData,
          requestBody: requestBody
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Process the results and transform them to our application format
    const results = (responseData.places || []).map((place: any) => {
      // Get the website URL if available
      const websiteUrl = place.websiteUri || 'https://example.com/no-website';
      
      // Extract the business name
      const title = place.displayName?.text || '';
      
      // Create a description from the address and other details
      const addressParts = [
        place.formattedAddress,
        place.internationalPhoneNumber
      ].filter(Boolean);
      
      const description = addressParts.join(' • ');
      
      // Create a consistent result object
      return {
        url: websiteUrl,
        details: {
          title,
          description,
          placeId: place.id,
          location: place.location,
          rating: place.rating,
          reviewCount: place.userRatingCount,
          phone: place.internationalPhoneNumber,
          address: place.formattedAddress,
          businessType: place.primaryType || (place.types && place.types.length > 0 ? place.types[0] : ''),
          photoReference: place.photos && place.photos.length > 0 ? place.photos[0].name : null,
          openingHours: place.regularOpeningHours,
          lastChecked: new Date().toISOString(),
          priceLevel: place.priceLevel
        }
      };
    });

    // Prepare the response data
    const response_data: SearchResponse = {
      results,
      hasMore: !!responseData.nextPageToken,
      nextPageToken: responseData.nextPageToken || null
    };

    // Store the results in the cache for future use (only initial searches, not paginated ones)
    if (!pageToken) {
      const cacheKey = `${query}_${country}_${region}`.toLowerCase().replace(/\s+/g, '_');
      
      try {
        await supabase
          .from('cached_places')
          .upsert({
            place_id: cacheKey,
            business_name: query,
            place_data: {
              results: response_data.results,
              nextPageToken: response_data.nextPageToken,
              query,
              country,
              region
            },
            search_batch_id: cacheKey,
            last_accessed: new Date().toISOString()
          });
        
        console.log(`Cached search results for "${query}"`);
      } catch (cacheError) {
        console.error('Error storing results in cache:', cacheError);
        // Continue even if caching fails
      }
    }

    // Return the final response
    return new Response(
      JSON.stringify(response_data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Search-places function error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
