
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// CORS headers to allow cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

interface SearchOptions {
  query: string;
  country: string;
  region?: string;
  startIndex?: number;
  limit?: number;
  include_details?: boolean;
  client_timestamp?: string;
  pageToken?: string; // Added support for pageToken
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const options: SearchOptions = await req.json();
    
    // Input validation
    if (!options.query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing search request for: ${options.query}, country: ${options.country}, region: ${options.region || 'not specified'}`);
    if (options.pageToken) {
      console.log(`Using pageToken: ${options.pageToken}`);
    }

    // Initialize Supabase client to check for cached results and store new ones
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate a unique ID for this search batch for caching
    const searchBatchId = crypto.randomUUID();
    
    // Check if we can use cached results
    let cachedResults = null;
    if (!options.pageToken) { // Only use cache for first page requests
      const { data: existingCache } = await supabase
        .from('cached_places')
        .select('place_data, place_id')
        .ilike('business_name', `%${options.query}%`)
        .eq('country', options.country)
        .order('last_accessed', { ascending: false })
        .limit(options.limit || 20);
      
      if (existingCache && existingCache.length > 0) {
        console.log(`Found ${existingCache.length} cached results for query: ${options.query}`);
        cachedResults = existingCache.map(item => item.place_data);
        
        // Update last_accessed timestamp for these results
        const placeIds = existingCache.map(item => item.place_id);
        await supabase
          .from('cached_places')
          .update({ last_accessed: new Date().toISOString() })
          .in('place_id', placeIds);
        
        // If we have enough cached results, return them immediately
        if (cachedResults.length >= (options.limit || 20)) {
          return new Response(
            JSON.stringify({
              results: cachedResults,
              hasMore: false, // We don't know if there are more without checking API
              source: 'cache'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
      }
    }

    // Create Google Places API request
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Build the request body for Google Places API v1
    let requestBody: any = {
      textQuery: `${options.query} in ${options.region || ''} ${options.country}`.trim(),
      includedType: 'business',
      maxResultCount: options.limit || 20,
      languageCode: 'en',
      maxResultSizePerType: options.limit || 20,
    };

    // If we have a pageToken, include it in the request
    if (options.pageToken) {
      requestBody.pageToken = options.pageToken;
    }

    const url = 'https://places.googleapis.com/v1/places:searchText';
    console.log(`Making request to Places API with query: ${options.query}`);
    console.log('Request body:', JSON.stringify(requestBody));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.priceLevel,places.businessStatus,places.types,places.id'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}): ${errorText}`);
      return new Response(
        JSON.stringify({ error: `API returned error: ${response.status}`, details: errorText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    const responseData = await response.json();
    console.log(`Received response with ${responseData.places?.length || 0} places`);
    
    // Process results
    const results = responseData.places?.map((place: any) => {
      // Extract relevant data
      const businessName = place.displayName?.text || '';
      const address = place.formattedAddress || '';
      const websiteUrl = place.websiteUri || 'https://example.com/no-website';
      const phone = place.nationalPhoneNumber || '';
      const rating = place.rating || 0;
      const reviewCount = place.userRatingCount || 0;
      const priceLevel = place.priceLevel || '';
      const businessStatus = place.businessStatus || '';
      const businessTypes = place.types || [];
      const placeId = place.id || '';

      // Format as expected by the frontend
      const result = {
        url: websiteUrl,
        details: {
          title: businessName,
          description: address,
          phone,
          rating,
          reviewCount,
          priceLevel,
          businessStatus,
          businessType: businessTypes.join(', '),
          lastChecked: new Date().toISOString(),
          placeId
        }
      };

      // Cache the result if it has a valid website (not the placeholder)
      if (websiteUrl !== 'https://example.com/no-website') {
        try {
          supabase
            .from('cached_places')
            .upsert({
              place_id: placeId,
              business_name: businessName,
              place_data: result,
              search_batch_id: searchBatchId,
              country: options.country,
              created_at: new Date().toISOString(),
              last_accessed: new Date().toISOString()
            })
            .then((response) => {
              if (response.error) {
                console.error(`Error caching place ${placeId}:`, response.error);
              }
            });
        } catch (error) {
          console.error('Error storing in cache:', error);
        }
      }

      return result;
    }) || [];

    // If we had partial cached results, we need to combine them with the new results
    // but ensure no duplicates by URL
    if (cachedResults && cachedResults.length > 0) {
      const allUrls = new Set(results.map((r: any) => r.url));
      const uniqueCachedResults = cachedResults.filter((r: any) => !allUrls.has(r.url));
      results.push(...uniqueCachedResults.slice(0, options.limit ? options.limit - results.length : 20 - results.length));
    }

    // Check if there might be more results available
    const hasMore = !!responseData.nextPageToken;
    console.log(`Has more results: ${hasMore}`);

    const response_data = {
      results,
      hasMore,
      source: 'api'
    };

    // Include the token in the response if it exists
    if (responseData.nextPageToken) {
      response_data.nextPageToken = responseData.nextPageToken;
      console.log(`Next page token: ${responseData.nextPageToken}`);
    }

    return new Response(
      JSON.stringify(response_data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
