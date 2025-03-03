
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client with the service role key for admin access
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY') ?? '';

const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const options = await req.json();
    console.log('Received search request with options:', JSON.stringify(options));
    
    // Basic validation
    if (!options.query) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: query' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { 
      query, 
      country, 
      region = '', 
      pageToken, 
      testMode = false,
      searchId: existingSearchId
    } = options;

    // Get timestamp to ensure consistent client/server logging correlation
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Processing search: "${query}" in ${country}${region ? '/' + region : ''}`);

    // For test mode requests, return mock data
    if (testMode) {
      console.log('Test mode enabled, returning mock data');
      const mockData = generateMockData(query, country, region);
      return new Response(
        JSON.stringify(mockData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Generate a searchId for the first request to associate results
    const searchId = existingSearchId || crypto.randomUUID();
    console.log(`Using search ID: ${searchId}`);

    const maxResults = 20; // Google Places API limit per request

    // Build search request for Google Places API
    const requestBody: any = {
      textQuery: query,
      languageCode: "en"
    };

    // Add locationBias if country is provided (required for regional searches)
    if (country) {
      // Set region/country code if provided
      if (country.length === 2) {
        requestBody.locationBias = {
          rectangle: {
            low: { latitude: -90, longitude: -180 },
            high: { latitude: 90, longitude: 180 }
          }
        };
        requestBody.regionCode = country.toUpperCase();
      }
    }

    if (pageToken) {
      requestBody.pageToken = pageToken;
      console.log(`Using page token for pagination: ${pageToken.substring(0, 10)}...`);
    }

    console.log('Sending request to Google Places API:', JSON.stringify(requestBody));

    // Call the Google Places API Text Search endpoint
    const googleApiUrl = 'https://places.googleapis.com/v1/places:searchText';
    const response = await fetch(googleApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleApiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.types,places.rating,places.userRatingCount'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google API error (${response.status}):`, errorText);
      return new Response(
        JSON.stringify({ error: `API request failed with status ${response.status}`, details: errorText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const data = await response.json();
    console.log(`Received ${data.places?.length || 0} places from Google API`);
    
    // Transform the Google Places API response to match our app's format
    const results = data.places?.map((place: any) => {
      // Extract business type from the first type if available
      const businessType = place.types && place.types.length > 0 
        ? place.types[0].replace(/_/g, ' ') 
        : null;

      return {
        url: place.websiteUri || `https://example.com/no-website`, // Placeholder for places without websites
        title: place.displayName?.text || '',
        description: place.formattedAddress || '',
        details: {
          title: place.displayName?.text || '',
          description: place.formattedAddress || '',
          placeId: place.id,
          businessType,
          rating: place.rating,
          reviewCount: place.userRatingCount,
          location: place.formattedAddress
        }
      };
    }) || [];

    console.log(`Transformed ${results.length} results for response`);

    // Add error handling for database operations
    try {
      if (results.length > 0 && !existingSearchId) {
        // Only create search metadata for first page (not for pagination)
        console.log(`Storing search metadata for: "${query}"`);
        
        const { error: metadataError } = await supabaseClient
          .from('searches')
          .insert({
            id: searchId,
            query,
            country,
            region,
            result_count: results.length
          });
          
        if (metadataError) {
          console.error('Error inserting search metadata:', metadataError);
          // Continue execution even if metadata insertion fails
        } else {
          console.log('Successfully inserted search metadata');
        }
        
        // Insert results with the search ID
        console.log(`Storing ${results.length} search results with search ID: ${searchId}`);
        const searchResults = results.map(result => ({
          search_id: searchId,
          place_id: result.details?.placeId,
          url: result.url,
          title: result.title,
          description: result.description,
          details: result.details || {}, // Ensure details is always an object
          query
        }));
        
        const { error: resultsError } = await supabaseClient
          .from('search_results')
          .insert(searchResults);
          
        if (resultsError) {
          console.error('Error inserting search results:', resultsError);
          // Continue execution even if results insertion fails
        } else {
          console.log('Successfully inserted search results');
        }
      } else if (existingSearchId && results.length > 0) {
        // For pagination, just add the additional results
        console.log(`Adding ${results.length} paginated results to existing search: ${existingSearchId}`);
        
        const searchResults = results.map(result => ({
          search_id: existingSearchId,
          place_id: result.details?.placeId,
          url: result.url,
          title: result.title,
          description: result.description,
          details: result.details || {},
          query
        }));
        
        const { error: resultsError } = await supabaseClient
          .from('search_results')
          .insert(searchResults);
          
        if (resultsError) {
          console.error('Error inserting paginated search results:', resultsError);
        } else {
          console.log('Successfully inserted paginated search results');
          
          // Update the total count in the search record
          const { error: updateError } = await supabaseClient
            .from('searches')
            .update({ result_count: supabaseClient.rpc('increment', { x: results.length }) })
            .eq('id', existingSearchId);
            
          if (updateError) {
            console.error('Error updating search result count:', updateError);
          }
        }
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      // Continue execution, don't let DB errors stop the response
    }

    // Return response including the next page token if available
    return new Response(
      JSON.stringify({
        results,
        nextPageToken: data.nextPageToken,
        totalResults: results.length,
        searchId,
        hasMore: Boolean(data.nextPageToken)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Unhandled error in search-places function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Generate mock data for testing
function generateMockData(query: string, country: string, region: string) {
  const mockResults = Array(10).fill(null).map((_, i) => ({
    url: `https://example.com/result-${i+1}`,
    title: `Mock Result ${i+1} for "${query}"`,
    description: `This is a mock result for a search in ${country}${region ? '/' + region : ''}`,
    details: {
      title: `Mock Result ${i+1} for "${query}"`,
      description: `This is a mock result for a search in ${country}${region ? '/' + region : ''}`,
      placeId: `mock-place-id-${i+1}`,
      businessType: 'mock_business',
      rating: 4.5,
      reviewCount: 42,
      location: `Mock Location, ${region || ''} ${country}`.trim()
    }
  }));

  const mockSearchId = crypto.randomUUID();

  return {
    results: mockResults,
    nextPageToken: 'mock-next-page-token',
    totalResults: mockResults.length,
    searchId: mockSearchId,
    hasMore: true
  };
}
