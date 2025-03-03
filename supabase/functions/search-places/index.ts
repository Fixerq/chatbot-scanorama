
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Environment variables
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchMoreResults(requestBody, apiKey, desiredCount = 30) {
  let allResults = [];
  let nextPageToken = null;
  let pageCount = 0;
  const MAX_PAGES = Math.ceil(desiredCount / 20); // Calculate how many pages we need (at least 2)
  
  do {
    // Add page token if we have one from previous request
    if (nextPageToken) {
      requestBody.pageToken = nextPageToken;
    }
    
    // Make the API request
    const apiUrl = `https://places.googleapis.com/v1/places:searchText?key=${apiKey}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.rating,places.userRatingCount,places.types'
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Google Places API error:', response.status, responseData);
      break;
    }
    
    // Add this page's results to our collection
    const placesResults = responseData.places || [];
    allResults = [...allResults, ...placesResults];
    
    // Get next page token for pagination
    nextPageToken = responseData.nextPageToken;
    pageCount++;
    
    // Stop if we've reached desired count, max pages, or no more results
    if (allResults.length >= desiredCount || pageCount >= MAX_PAGES || !nextPageToken) {
      break;
    }
    
    // Wait a bit between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
    
  } while (nextPageToken);
  
  return {
    results: allResults,
    nextPageToken: nextPageToken,
    hasMore: !!nextPageToken
  };
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const options = await req.json();
    const { 
      query, 
      country, 
      region, 
      pageToken, 
      existingPlaceIds = [],
      searchId,
      user_id,
      testMode = false
    } = options;

    console.log('Received search request:', JSON.stringify({
      query,
      country,
      region,
      pageToken: pageToken ? 'exists' : 'none',
      existingPlaceIdsCount: existingPlaceIds.length,
      searchId,
      testMode
    }));

    // If we're in test mode, return dummy data
    if (testMode) {
      console.log('Running in test mode, returning dummy data');
      
      // Generate some dummy results
      const dummyResults = Array.from({ length: 10 }, (_, i) => ({
        id: `test-place-${i}`,
        url: `https://example.com/business-${i}`,
        title: `Test Business ${i}`,
        description: `${i} Main St, Testville, ${country}`,
        details: {
          title: `Test Business ${i}`,
          description: `${i} Main St, Testville, ${country}`,
          rating: 4.5,
          reviewCount: 100,
          businessType: 'business',
          location: `${i} Main St, Testville, ${country}`
        }
      }));
      
      return new Response(JSON.stringify({
        results: dummyResults,
        nextPageToken: 'dummy-next-page-token',
        hasMore: true,
        searchId: searchId || 'new-test-search-id'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Prepare the request body for Google Places API
    const requestBody = {
      textQuery: query,
      maxResultCount: 20, // API max per request
      languageCode: "en"
    };

    if (country && country.length === 2) {
      requestBody.regionCode = country.toUpperCase();
    }

    // If we were given a pageToken, use it directly
    if (pageToken) {
      requestBody.pageToken = pageToken;
    }

    // Check if this is a pagination request
    let dbSearchId = searchId;
    if (!dbSearchId && !pageToken) {
      // This is a new search, create a record in the database
      console.log('Creating new search record in database');
      const { data: newSearch, error: searchError } = await supabase
        .from('searches')
        .insert({
          query,
          country,
          region,
          user_id: user_id || null,
          result_count: 0
        })
        .select()
        .single();

      if (searchError) {
        console.error('Error creating search record:', searchError);
      } else {
        dbSearchId = newSearch.id;
        console.log('Created new search with ID:', dbSearchId);
      }
    }

    // Fetch results
    console.log('Fetching results from Google Places API');
    const { results: placesResults, nextPageToken, hasMore } = 
      await fetchMoreResults(requestBody, GOOGLE_API_KEY, pageToken ? 20 : 30);
    
    console.log(`Retrieved ${placesResults.length} results from Google Places API`);

    // Process results
    const processedResults = placesResults.map(place => ({
      id: place.id, // Store Place ID for deduplication
      url: place.websiteUri || `https://www.google.com/search?q=${encodeURIComponent(place.displayName?.text || '')}`,
      title: place.displayName?.text || 'Unknown Business',
      description: place.formattedAddress || '',
      details: {
        title: place.displayName?.text || 'Unknown Business',
        description: place.formattedAddress || '',
        rating: place.rating || 0,
        reviewCount: place.userRatingCount || 0,
        businessType: (place.types || [])[0] || '',
        location: place.formattedAddress || ''
      }
    }));

    // Filter out any places that match existing IDs
    const filteredResults = processedResults.filter(result => 
      !existingPlaceIds.includes(result.id)
    );
    
    console.log(`Returning ${filteredResults.length} unique new results`);

    // Store results in database if we have a search ID
    if (dbSearchId && filteredResults.length > 0) {
      const resultsToInsert = filteredResults.map(result => ({
        search_id: dbSearchId,
        place_id: result.id,
        url: result.url,
        title: result.title,
        description: result.description,
        details: result.details,
        query
      }));

      console.log('Storing search results in database');
      const { error: insertError } = await supabase
        .from('search_results')
        .insert(resultsToInsert);

      if (insertError) {
        console.error('Error storing search results:', insertError);
      } else {
        // Update the search record with the new result count
        const { error: updateError } = await supabase.rpc('increment', {
          search_id: dbSearchId,
          increment_amount: filteredResults.length
        });

        if (updateError) {
          console.error('Error updating search result count:', updateError);
        }
      }
    }

    // Return results
    return new Response(
      JSON.stringify({
        results: filteredResults,
        nextPageToken: nextPageToken,
        hasMore: hasMore,
        searchId: dbSearchId || searchId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error processing search request:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to process search request',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
