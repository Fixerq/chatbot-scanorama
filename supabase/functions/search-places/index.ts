
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

console.log("Search Places function loaded");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204 
    });
  }

  try {
    console.log("Processing request");
    
    // Parse request body with error handling
    let options;
    try {
      options = await req.json();
      console.log('Received request with options:', JSON.stringify(options));
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
          details: jsonError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Extract params from request
    const { query, country, region, pageToken, testMode } = options;
    
    // Add a test mode to help with debugging
    if (testMode === true || testMode === 'true') {
      console.log('Test mode enabled, returning mock data');
      
      // Sleep for 500ms to simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
              description: '456 Oak Ave, Somewhere, USA',
              details: {
                title: 'Test Business 2',
                description: '456 Oak Ave, Somewhere, USA',
                phone: '+1-555-987-6543',
                rating: 3.8,
                reviewCount: 87,
                businessType: 'retail',
                location: '456 Oak Ave, Somewhere, USA'
              }
            }
          ],
          hasMore: true,
          nextPageToken: 'fake_token_123'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Validate required parameters
    if (!query) {
      console.log('Missing required parameter: query');
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: query' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Get API key
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!GOOGLE_API_KEY) {
      console.error('GOOGLE_PLACES_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: 'API key not configured'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    console.log(`Searching for "${query}" in ${country}${region ? ', ' + region : ''}`);

    // Build request for Places API v1
    const apiUrl = 'https://places.googleapis.com/v1/places:searchText';
    
    const requestBody = {
      textQuery: query,
      maxResultCount: 20,
      languageCode: "en"
    };

    // Add locationBias if we have valid country/region
    if (country && country.length === 2) {
      requestBody.regionCode = country.toUpperCase();
    }

    // Add pageToken if provided for pagination
    if (pageToken) {
      requestBody.pageToken = pageToken;
      console.log("Using page token for pagination:", pageToken);
    }

    console.log('Request body:', JSON.stringify(requestBody));

    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      console.log('Sending request to Google Places API...');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.internationalPhoneNumber,places.regularOpeningHours,places.primaryType,places.types,places.rating,places.userRatingCount'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      // Parse JSON response
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid response from Places API',
            status: response.status,
            statusText: response.statusText 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 502
          }
        );
      }

      console.log(`Google Places API response status: ${response.status}`);
      
      // Check for API errors
      if (!response.ok) {
        console.error('Places API error:', responseData);
        return new Response(
          JSON.stringify({ 
            error: 'Google Places API error', 
            status: response.status,
            details: responseData 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: response.status
          }
        );
      }

      // Process results from Places API v1
      const results = (responseData.places || []).map((place) => {
        // Extract website URL or use placeholder
        const websiteUrl = place.websiteUri || '';
        
        return {
          url: websiteUrl,
          title: place.displayName?.text || 'Unknown Business',
          description: place.formattedAddress || '',
          details: {
            title: place.displayName?.text || 'Unknown Business',
            description: place.formattedAddress || '',
            phone: place.internationalPhoneNumber || '',
            rating: place.rating || 0,
            reviewCount: place.userRatingCount || 0,
            businessType: place.primaryType || (place.types && place.types.length > 0 ? place.types[0] : ''),
            location: place.formattedAddress || ''
          }
        };
      });

      console.log(`Processed ${results.length} results`);

      // Return formatted response with pagination token
      return new Response(
        JSON.stringify({
          results,
          hasMore: !!responseData.nextPageToken,
          nextPageToken: responseData.nextPageToken || null
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Request to Google Places API timed out');
        return new Response(
          JSON.stringify({ 
            error: 'Request to Google Places API timed out', 
            details: 'The request took too long to complete'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 504
          }
        );
      }
      
      console.error('Error fetching from Google Places API:', fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Error fetching from Google Places API', 
          details: fetchError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
  } catch (error) {
    console.error('Unhandled error in function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
