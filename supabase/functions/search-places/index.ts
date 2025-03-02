
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use the correctly named environment variable
    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
    
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('Missing Google Places API key');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing API key' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const { query, country, region, startIndex = 0, limit = 10, include_details = false } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: query' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Searching for: "${query}" in ${region || ''} ${country || ''}, startIndex: ${startIndex}`);

    // URL for the Google Places API Text Search endpoint
    const searchUrl = `https://places.googleapis.com/v1/places:searchText`;

    // Build location bias and restriction based on country and region
    let locationBias = {};
    let locationRestriction = {};

    if (country) {
      // Set country restriction
      locationRestriction = {
        rectangle: {
          low: { latitude: -90, longitude: -180 },
          high: { latitude: 90, longitude: 180 }
        }
      };

      // Add country code to restrict results
      if (country === "United States") {
        locationRestriction = { 
          includedCountries: ["US"] 
        };
      } else if (country === "United Kingdom") {
        locationRestriction = { 
          includedCountries: ["GB"] 
        };
      } else if (country === "Canada") {
        locationRestriction = { 
          includedCountries: ["CA"] 
        };
      } else if (country === "Australia") {
        locationRestriction = { 
          includedCountries: ["AU"] 
        };
      } else {
        // For other countries, use the name as is
        locationRestriction = { 
          includedCountries: [country.substring(0, 2).toUpperCase()] 
        };
      }

      // If region is provided, add region bias
      if (region) {
        locationBias = {
          circle: {
            center: {
              latitude: 0,
              longitude: 0
            },
            radius: 50000.0
          }
        };
      }
    }

    // Request body for the Places API
    const searchBody = {
      textQuery: query,
      locationBias: Object.keys(locationBias).length > 0 ? locationBias : undefined,
      locationRestriction: Object.keys(locationRestriction).length > 0 ? locationRestriction : undefined,
      maxResultCount: limit,
      pageSize: limit,
      pageToken: startIndex > 0 ? `token_${startIndex}` : undefined,
      languageCode: "en"
    };

    // Define the fields we want to retrieve
    const fieldMask = include_details 
      ? "places.displayName,places.formattedAddress,places.websiteUri,places.id,places.location,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.regularOpeningHours,places.priceLevel,places.primaryType,places.photos"
      : "places.displayName,places.formattedAddress,places.websiteUri,places.id";

    console.log('Search request:', JSON.stringify(searchBody));

    // Make the API call to Google Places
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': fieldMask,
        ...corsHeaders
      },
      body: JSON.stringify(searchBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Places API error (${response.status}): ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: `Google Places API error: ${response.status}`, 
          details: errorText 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    const data = await response.json();
    console.log(`Received ${data.places?.length || 0} places from Google API`);

    // Process the results
    const results = data.places?.map(place => {
      // Extract the basic information
      const result = {
        url: place.websiteUri || 'https://example.com/no-website',
        title: place.displayName?.text || 'Business Name Not Available',
        description: place.formattedAddress || '',
        details: {
          title: place.displayName?.text || 'Business Name Not Available',
          description: place.formattedAddress || '',
          lastChecked: new Date().toISOString(),
        }
      };

      // Add additional details if requested
      if (include_details) {
        result.details = {
          ...result.details,
          phone: place.nationalPhoneNumber,
          rating: place.rating,
          reviewCount: place.userRatingCount,
          businessType: place.primaryType,
          priceLevel: place.priceLevel,
          location: place.location ? `${place.location.latitude},${place.location.longitude}` : null,
          openingHours: place.regularOpeningHours?.periods?.map(period => ({
            open: period.open?.day + ':' + period.open?.hour + ':' + period.open?.minute,
            close: period.close?.day + ':' + period.close?.hour + ':' + period.close?.minute,
          })) || []
        };
      }

      return result;
    }) || [];

    // Check if there are more results available
    const hasMore = data.nextPageToken !== undefined;

    return new Response(
      JSON.stringify({ 
        results, 
        hasMore,
        totalResults: results.length,
        nextPageToken: data.nextPageToken
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
