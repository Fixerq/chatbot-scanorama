
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Configure CORS headers with the prefer header included
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

// Convert countries to ISO 2-letter country codes for the Google Places API
const countryCodeMap: Record<string, string> = {
  'United States': 'US',
  'United Kingdom': 'GB',
  'Canada': 'CA',
  'Australia': 'AU',
  'India': 'IN',
  'Germany': 'DE',
  'France': 'FR',
  'Spain': 'ES',
  'Italy': 'IT',
  'Japan': 'JP',
  'China': 'CN',
  'Brazil': 'BR',
  'Mexico': 'MX',
  // Add more countries as needed
};

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Get the Google Places API key from environment
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('Google Places API key is not configured');
    }

    // Parse the request body
    const options = await req.json();
    console.log('Received search request with options:', JSON.stringify(options, null, 2));

    // Extract and validate required parameters
    const { query, country, region, pageToken, startIndex = 0 } = options;
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required', status: 'input_error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Determine cache key
    const cacheKey = `${query}:${country}:${region}:${startIndex}:${pageToken || ''}`;
    
    // Check if we have a cached result
    const { data: cachedResult } = await supabase
      .from('cached_places')
      .select('*')
      .eq('cache_key', cacheKey)
      .single();

    if (cachedResult && cachedResult.expires_at > new Date().toISOString()) {
      console.log(`Cache hit for query: ${cacheKey}`);
      // Update last accessed time
      await supabase
        .from('cached_places')
        .update({ last_accessed: new Date().toISOString() })
        .eq('cache_key', cacheKey);
        
      return new Response(
        cachedResult.result_data,
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Cache miss, fetching from Google Places API');

    // Prepare the Places API request
    // Format the request according to the Places API v1 requirements
    let requestBody: any = {
      textQuery: query,
      maxResultCount: 20,
      languageCode: "en"
    };

    // Handle region/country
    if (country) {
      // Try to map the country name to a country code
      const countryCode = countryCodeMap[country] || country;
      if (countryCode && countryCode.length === 2) {
        requestBody.regionCode = countryCode.toUpperCase();
      }
    }

    // Add locationBias for more relevant results if region is provided
    if (region && region.trim() !== '') {
      requestBody.textQuery = `${query} in ${region}, ${country}`;
    }

    // Include pageToken for pagination if available
    if (pageToken) {
      requestBody.pageToken = pageToken;
    }
    
    console.log('Sending request to Google Places API:', JSON.stringify(requestBody, null, 2));
    
    // Make the request to the Google Places API
    const apiUrl = "https://places.googleapis.com/v1/places:searchText";
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.id,places.location,places.types,places.businessStatus,places.rating,places.userRatingCount,places.priceLevel,places.regularOpeningHours,places.photos,nextPageToken'
      },
      body: JSON.stringify(requestBody)
    });

    // Parse the response
    const responseData = await response.json();

    // Check if we got an error from the Places API
    if (!response.ok) {
      console.error('Google Places API error:', response.status, JSON.stringify(responseData, null, 2));
      
      return new Response(
        JSON.stringify({
          error: `Google Places API error (${response.status})`,
          details: responseData?.error?.message || 'Unknown error',
          status: 'api_error',
          rawResponse: responseData
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    console.log('Google Places API response received');
    
    // Transform the response to the expected format
    const results = (responseData.places || []).map((place: any) => {
      const websiteUrl = place.websiteUri || 'https://example.com/no-website';
      
      return {
        url: websiteUrl,
        details: {
          title: place.displayName?.text || 'Unknown Business',
          description: place.formattedAddress || '',
          phone: place.internationalPhoneNumber || place.nationalPhoneNumber || '',
          rating: place.rating,
          reviewCount: place.userRatingCount,
          businessType: place.types?.[0] || '',
          priceLevel: place.priceLevel,
          openingHours: place.regularOpeningHours?.periods,
          location: place.location,
          photoReference: place.photos?.[0]?.name,
          placeId: place.id
        }
      };
    });

    // Check if there might be more results available
    const hasMore = responseData.nextPageToken ? true : false;
    
    // Prepare the response
    const response_data = {
      results,
      hasMore,
      nextPageToken: responseData.nextPageToken
    };

    // Store in cache
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24); // Cache for 24 hours
    
    await supabase
      .from('cached_places')
      .upsert({
        cache_key: cacheKey,
        result_data: JSON.stringify(response_data),
        query: query,
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        expires_at: expiryDate.toISOString()
      });

    // Return the response with CORS headers
    return new Response(
      JSON.stringify(response_data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in search-places function:', error);
    
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
