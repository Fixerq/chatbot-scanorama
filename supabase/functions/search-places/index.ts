
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Use environment variables for keys
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY') || '';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract request data
    const options = await req.json();
    const { 
      query, 
      country, 
      region, 
      pageToken, 
      limit = 20, 
      testMode = false, 
      client_timestamp 
    } = options;

    console.log('Places search request received:', { 
      query, 
      country, 
      region, 
      pageToken: pageToken ? 'exists' : 'none',
      timestamp: client_timestamp || new Date().toISOString()
    });

    // Test mode for debugging
    if (testMode) {
      console.log('Test mode activated, returning sample data');
      return new Response(
        JSON.stringify({
          results: [
            {
              url: 'https://example.com/business1',
              title: 'Test Business 1',
              description: '123 Main St, Anytown, USA',
              details: {
                title: 'Test Business 1',
                description: '123 Main St, Anytown, USA',
                phone: '+1-555-123-4567',
                rating: 4.5,
                reviewCount: 123,
                businessType: 'restaurant',
                location: '123 Main St, Anytown, USA'
              }
            },
            {
              url: 'https://example.com/business2',
              title: 'Test Business 2',
              description: '456 Oak Ave, Someville, USA',
              details: {
                title: 'Test Business 2',
                description: '456 Oak Ave, Someville, USA',
                phone: '+1-555-987-6543',
                rating: 4.8,
                reviewCount: 256,
                businessType: 'retail',
                location: '456 Oak Ave, Someville, USA'
              }
            }
          ],
          hasMore: true,
          nextPageToken: 'sample_token_123'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Check for required API key
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('Google Places API key not found in secrets table');
      return new Response(
        JSON.stringify({ 
          error: 'API configuration error', 
          status: 'config_error',
          details: 'Missing API key'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // First, check cache for this query
    if (!pageToken) {
      const cacheKey = `${query}_${country}_${region}`.toLowerCase();
      const { data: cachedData } = await supabase
        .from('cached_places')
        .select('results, next_page_token')
        .eq('query_hash', cacheKey)
        .single();

      if (cachedData) {
        console.log('Cache hit for query:', cacheKey);
        // Update last accessed timestamp in background
        supabase
          .from('cached_places')
          .update({ last_accessed: new Date().toISOString() })
          .eq('query_hash', cacheKey)
          .then(() => console.log('Updated cache timestamp'));

        return new Response(
          JSON.stringify({
            results: cachedData.results,
            hasMore: Boolean(cachedData.next_page_token),
            nextPageToken: cachedData.next_page_token || null
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }
      console.log('Cache miss for query:', cacheKey);
    } else {
      console.log('Using pageToken for pagination, skipping cache');
    }

    // Set up request to Google Places API v1
    const apiUrl = 'https://places.googleapis.com/v1/places:searchText';
    
    // Build the request body
    const requestBody: any = {
      textQuery: query,
      maxResultCount: Math.min(limit, 20), // Google limits to 20 per request
      languageCode: "en"
    };

    // Add pageToken if available for pagination
    if (pageToken) {
      requestBody.pageToken = pageToken;
      console.log('Using pageToken for pagination:', pageToken);
    }

    // Add region/country information if available
    if (country && country.length === 2) {
      requestBody.regionCode = country.toUpperCase();
    }
    
    if (region) {
      // For better regional results, add the region to the text query if it's not already there
      if (!query.toLowerCase().includes(region.toLowerCase())) {
        requestBody.textQuery = `${requestBody.textQuery} ${region}`;
      }
    }

    console.log('Sending request to Places API:', JSON.stringify(requestBody));

    // Set up a minimal field mask first to ensure the API works
    // const minimalFieldMask = 'places.id,places.displayName,places.formattedAddress,places.websiteUri';
    
    // Full field mask for complete data
    const fullFieldMask = 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.internationalPhoneNumber,places.regularOpeningHours,places.primaryType,places.types,places.rating,places.userRatingCount,places.priceLevel,places.businessStatus,places.photos';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': fullFieldMask
        },
        body: JSON.stringify(requestBody)
      });

      // Check for HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Places API error:', response.status, errorText);
        
        return new Response(
          JSON.stringify({
            error: `Google Places API error: ${response.status}`,
            details: errorText,
            status: response.status >= 500 ? 'server_error' : 'api_error'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: response.status
          }
        );
      }

      // Parse the response
      const responseData = await response.json();
      console.log('Places API response received:', 
        JSON.stringify({
          places_count: responseData.places?.length || 0,
          has_next_page: !!responseData.nextPageToken
        })
      );

      // Map the response to our expected format
      const results = (responseData.places || []).map((place: any) => {
        // Extract website URL or use placeholder
        let websiteUrl = place.websiteUri || '';
        
        // Skip entries without websites if we're specifically looking for sites with chatbots
        if (!websiteUrl) {
          websiteUrl = 'https://example.com/no-website';
        }
        
        return {
          url: websiteUrl,
          status: 'Ready for analysis',
          details: {
            title: place.displayName?.text || 'Unknown Business',
            description: place.formattedAddress || '',
            lastChecked: new Date().toISOString(),
            phone: place.internationalPhoneNumber || '',
            rating: place.rating || 0,
            reviewCount: place.userRatingCount || 0,
            businessType: place.primaryType || (place.types || [])[0] || '',
            priceLevel: place.priceLevel || '',
            openingHours: place.regularOpeningHours?.periods || [],
            location: place.formattedAddress || '',
            photoReference: place.photos && place.photos.length > 0 ? place.photos[0].name : '',
            placeId: place.id || ''
          }
        };
      });
      
      // Prepare the response
      const response_data = {
        results,
        hasMore: !!responseData.nextPageToken,
        nextPageToken: responseData.nextPageToken || null
      };
      
      // If this was an initial query (not pagination), store in cache
      if (!pageToken) {
        const cacheKey = `${query}_${country}_${region}`.toLowerCase();
        const { error: cacheError } = await supabase
          .from('cached_places')
          .upsert({
            query_hash: cacheKey,
            query: query,
            country: country,
            region: region || '',
            results: results,
            next_page_token: responseData.nextPageToken || null,
            last_accessed: new Date().toISOString()
          });
          
        if (cacheError) {
          console.error('Error caching results:', cacheError);
        } else {
          console.log('Results cached successfully for:', cacheKey);
        }
      }
      
      return new Response(
        JSON.stringify(response_data),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } catch (apiError) {
      console.error('Error calling Google Places API:', apiError);
      return new Response(
        JSON.stringify({
          error: 'Google Places API call failed',
          details: apiError.message,
          status: 'api_error',
          requestBody
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
  } catch (error) {
    console.error('Uncaught error in edge function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        name: error.name,
        status: 'server_error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
