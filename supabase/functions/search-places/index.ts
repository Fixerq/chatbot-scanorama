
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.1.0';
import { corsHeaders } from './config.ts';
import { normalizeCountryCode } from './utils.ts';
import { fetchWithVariations } from './searchService.ts';
import { processResults } from './resultProcessor.ts';
import { PlacesSearchOptions } from './types.ts';
import { regionBounds } from './config.ts';

// API key from environment variable
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

// Main handler for Edge Function
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }
  
  try {
    // Check API key
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
    let options: PlacesSearchOptions;
    try {
      options = await req.json();
      console.log('Received search request with options:', JSON.stringify(options, null, 2));
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
    
    const { query, country, region, pageToken, limit = 20 } = options;
    
    // Basic validation
    if (!query?.trim()) {
      console.error('Missing query parameter');
      return new Response(
        JSON.stringify({
          error: 'Missing query parameter',
          status: 'invalid_params'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Prepare the request body
    const requestBody = {
      textQuery: query,
      maxResultCount: Math.min(limit, 20),
      languageCode: "en"
    };
    
    // Process country and region
    const countryCode = normalizeCountryCode(country);
    console.log(`Normalized country code: ${country} -> ${countryCode}`);
    
    // Add region code if we have a valid country code
    if (countryCode) {
      requestBody.regionCode = countryCode;
      console.log(`Setting region code to ${countryCode}`);
      
      // Add location bias if we have coordinates for this region
      if (region && regionBounds[countryCode] && regionBounds[countryCode][region]) {
        console.log(`Using region bounds for ${region}, ${countryCode}`);
        requestBody.locationBias = {
          rectangle: regionBounds[countryCode][region]
        };
      } else {
        console.log(`No region bounds found for ${region}, ${countryCode}`);
      }
    }
    
    // If we were given a pageToken, use it directly
    if (pageToken) {
      requestBody.pageToken = pageToken;
      console.log(`Using page token: ${pageToken}`);
    }
    
    // Fetch results
    console.log('Request body for Google Places API:', JSON.stringify(requestBody, null, 2));
    
    try {
      const { results: placesResults, nextPageToken, hasMore } = 
        await fetchWithVariations(query, countryCode, region, requestBody, GOOGLE_API_KEY, pageToken ? 20 : 60);
    
      console.log(`Retrieved ${placesResults.length} results from Google Places API`);
      
      // Process and filter results based on country
      const processedResults = processResults(
        placesResults.map(place => ({
          id: place.id,
          url: place.websiteUri || `https://www.google.com/search?q=${encodeURIComponent(place.displayName?.text || '')}`,
          title: place.displayName?.text || 'Unknown Business',
          description: place.formattedAddress || '',
          details: {
            title: place.displayName?.text || 'Unknown Business',
            description: place.formattedAddress || '',
            phone: place.internationalPhoneNumber || '',
            rating: place.rating || 0,
            reviewCount: place.userRatingCount || 0,
            businessType: place.primaryType || (place.types || [])[0] || '',
            priceLevel: place.priceLevel || 0,
            openingHours: place.regularOpeningHours ? 
              (place.regularOpeningHours.periods || []).map(p => ({
                open: p.open?.day + ' ' + p.open?.hour + ':' + p.open?.minute,
                close: p.close?.day + ' ' + p.close?.hour + ':' + p.close?.minute,
              })) : [],
            location: place.formattedAddress || ''
          }
        })),
        countryCode
      );
      
      // Return results with pagination token
      return new Response(
        JSON.stringify({
          results: processedResults,
          nextPageToken,
          hasMore
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } catch (apiError) {
      console.error('Error from Google Places API:', apiError);
      return new Response(
        JSON.stringify({
          error: 'Google Places API error',
          details: apiError.message,
          status: 'api_error'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
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
