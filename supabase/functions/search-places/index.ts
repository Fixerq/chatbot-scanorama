
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create Supabase client with service role key for database access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Robust CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

// Function to fetch all available pages of results from Google Places API
async function fetchAllPlacesResults(query, requestOptions, maxPages = 5) {
  let allResults = [];
  let nextPageToken = null;
  let currentOptions = { ...requestOptions };
  let pageCount = 0;
  
  do {
    // Add page token if available from previous request
    if (nextPageToken) {
      currentOptions.pageToken = nextPageToken;
      console.log(`Fetching page ${pageCount + 1} with token: ${nextPageToken.substring(0, 20)}...`);
    } else {
      console.log(`Fetching first page of results for query: ${query}`);
    }
    
    // Make request to Google Places API
    const apiUrl = `https://places.googleapis.com/v1/places:searchText?key=${GOOGLE_API_KEY}`;
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.rating,places.userRatingCount,places.types,places.nationalPhoneNumber,places.priceLevel'
        },
        body: JSON.stringify(currentOptions)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google Places API error on page ${pageCount + 1}:`, response.status, errorText);
        break;
      }
      
      const responseData = await response.json();
      
      // Process results from this page
      const pageResults = (responseData.places || []).map(place => ({
        place_id: place.id,
        url: place.websiteUri || `https://example.com/no-website`,
        title: place.displayName?.text || 'Unknown Business',
        description: place.formattedAddress || '',
        details: {
          title: place.displayName?.text || 'Unknown Business',
          description: place.formattedAddress || '',
          phone: place.nationalPhoneNumber || '',
          rating: place.rating || 0,
          reviewCount: place.userRatingCount || 0,
          businessType: (place.types || [])[0] || '',
          priceLevel: place.priceLevel || 0,
          location: place.formattedAddress || '',
          placeId: place.id
        },
        query: query
      }));
      
      console.log(`Fetched ${pageResults.length} results on page ${pageCount + 1}`);
      allResults = [...allResults, ...pageResults];
      
      // Get token for next page
      nextPageToken = responseData.nextPageToken;
      pageCount++;
      
      // Check if we've reached the maximum page limit
      if (pageCount >= maxPages && nextPageToken) {
        console.log(`Reached maximum page count (${maxPages}), stopping pagination`);
        break;
      }
      
      // Small delay to avoid hitting rate limits
      if (nextPageToken) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
    } catch (error) {
      console.error(`Error fetching page ${pageCount + 1}:`, error);
      break;
    }
  } while (nextPageToken);
  
  console.log(`Total results fetched across ${pageCount} pages: ${allResults.length}`);
  return allResults;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    if (!GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'API key configuration error',
          status: 'config_error'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse request options
    const options = await req.json();
    const { 
      query, 
      country, 
      region, 
      limit = 20, 
      userId = null,
      client_timestamp,
      testMode = false // For testing with sample data
    } = options;
    
    console.log('Received request with options:', JSON.stringify({
      query,
      country,
      region,
      limit,
      hasPageToken: !!options.pageToken,
      client_timestamp
    }, null, 2));

    // For test mode, return mock data immediately
    if (testMode) {
      console.log('Running in test mode, returning sample data');
      const mockData = {
        results: Array(10).fill(0).map((_, i) => ({
          url: `https://example-${i}.com`,
          title: `Test Business ${i}`,
          description: `Test address ${i}, ${region || ''}, ${country}`,
          details: {
            title: `Test Business ${i}`,
            description: `Test address ${i}, ${region || ''}, ${country}`,
            phone: `+1-555-000-${1000 + i}`,
            rating: Math.round(Math.random() * 5 * 10) / 10,
            reviewCount: Math.floor(Math.random() * 100),
            businessType: 'test_business',
          }
        })),
        hasMore: true,
        nextPageToken: 'test_page_token',
        searchId: 'test-search-id',
        totalResults: 42
      };
      return new Response(
        JSON.stringify(mockData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Basic validation
    if (!query?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing query parameter', status: 'invalid_params' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // In case we're directly given a page token for pagination from the client
    if (options.pageToken) {
      console.log('Direct pagination request with token:', options.pageToken.substring(0, 20) + '...');
      
      try {
        // Load results from the database for this search
        const { data: searchData, error: searchError } = await supabase
          .from('search_results')
          .select('*')
          .eq('search_id', options.searchId)
          .range((options.page - 1) * limit, options.page * limit - 1)
          .order('id', { ascending: true });
          
        if (searchError) {
          console.error('Error fetching results from database:', searchError);
          throw searchError;
        }
        
        // Get total count for accurate pagination
        const { count, error: countError } = await supabase
          .from('search_results')
          .select('*', { count: 'exact', head: true })
          .eq('search_id', options.searchId);
          
        if (countError) {
          console.error('Error getting count from database:', countError);
          throw countError;
        }
        
        console.log(`Returning page ${options.page} of results from database (${searchData.length} results)`);
        
        return new Response(
          JSON.stringify({
            results: searchData,
            hasMore: (options.page * limit) < count,
            searchId: options.searchId,
            totalResults: count
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error) {
        console.error('Error handling direct pagination:', error);
        return new Response(
          JSON.stringify({ error: 'Error fetching paginated results', details: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // Prepare request body for Google Places API
    const requestBody = {
      textQuery: query,
      maxResultCount: 20, // Maximum allowed by Places API for a single request
      languageCode: "en"
    };

    // Add regionCode if country is provided
    if (country) {
      if (country.length === 2) {
        requestBody.regionCode = country.toUpperCase();
      } else {
        // Include country name in the query for better results
        requestBody.textQuery = `${requestBody.textQuery} ${country}`;
      }
    }
    
    // Add region/state to query if provided
    if (region && region.trim()) {
      requestBody.textQuery = `${requestBody.textQuery} ${region.trim()}`;
    }

    // Generate a unique search ID
    const searchId = crypto.randomUUID();
    console.log(`Generated search ID: ${searchId}`);

    // Fetch all available results from Google Places API
    const allResults = await fetchAllPlacesResults(query, requestBody);
    
    // If no results found, return empty array
    if (allResults.length === 0) {
      console.log('No results found for query');
      return new Response(
        JSON.stringify({ 
          results: [], 
          hasMore: false,
          searchId,
          totalResults: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Store search metadata in Supabase
    try {
      const { error: searchInsertError } = await supabase
        .from('searches')
        .insert({
          id: searchId,
          query,
          country,
          region,
          user_id: userId,
          result_count: allResults.length
        });
        
      if (searchInsertError) {
        console.error('Error inserting search metadata:', searchInsertError);
        // Continue anyway - we can still return results even if DB insert fails
      } else {
        console.log(`Inserted search metadata with ID: ${searchId}`);
      }
      
      // Store all results in Supabase
      const { error: resultsInsertError } = await supabase
        .from('search_results')
        .insert(
          allResults.map(result => ({
            ...result,
            search_id: searchId
          }))
        );
        
      if (resultsInsertError) {
        console.error('Error inserting search results:', resultsInsertError);
        // Continue anyway - we can still return results even if DB insert fails
      } else {
        console.log(`Inserted ${allResults.length} results for search ID: ${searchId}`);
      }
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      // Continue anyway - we can still return results to the client
    }

    // Return first page of results to the client
    const firstPageResults = allResults.slice(0, limit);
    
    return new Response(
      JSON.stringify({
        results: firstPageResults,
        hasMore: allResults.length > limit,
        searchId,
        totalResults: allResults.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        status: 'server_error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
