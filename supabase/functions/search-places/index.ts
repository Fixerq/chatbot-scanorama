
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('GOOGLE_PLACES_API_KEY not configured in environment');
      return new Response(
        JSON.stringify({ 
          error: 'API key configuration error',
          status: 'api_error',
          details: 'GOOGLE_PLACES_API_KEY not configured in environment'
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    const { query, country, region, startIndex = 0, limit = 10, include_details = true } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required', status: 'invalid_request' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Map country names to ISO 3166-1 alpha-2 country codes
    const countryCodeMap: Record<string, string> = {
      "United States": "US",
      "United Kingdom": "GB",
      "Canada": "CA",
      "Australia": "AU",
      "Germany": "DE",
      "France": "FR",
      "Spain": "ES",
      "Italy": "IT",
      "Japan": "JP",
      "Brazil": "BR",
      "India": "IN",
      "China": "CN",
      "Singapore": "SG",
      "Netherlands": "NL",
      "Sweden": "SE",
      "Mexico": "MX",
      "South Africa": "ZA",
      "South Korea": "KR",
      "Russia": "RU",
      "United Arab Emirates": "AE",
      "New Zealand": "NZ",
      "Ireland": "IE",
      "Switzerland": "CH",
      "Norway": "NO",
      "Denmark": "DK",
      "Finland": "FI",
      "Belgium": "BE",
      "Austria": "AT",
      "Portugal": "PT",
      "Greece": "GR"
    };

    // Get the 2-letter country code if available
    let countryCode = null;
    if (country) {
      // Try to get the code from our map first
      countryCode = countryCodeMap[country];
      
      // If not found in our map, try to extract from the string
      if (!countryCode && country.length >= 2) {
        try {
          countryCode = country.substring(0, 2).toUpperCase();
        } catch (e) {
          console.warn('Could not derive country code from:', country);
        }
      }
    }

    // Set up the Places API request parameters
    const searchUrl = `https://places.googleapis.com/v1/places:searchText`;
    
    // Prepare location restriction if we have a country code
    let locationRestriction = null;
    let locationBias = null;
    
    // Handle region-based location bias
    if (region) {
      try {
        // Best-effort to create a bias for the region without exact coordinates
        // This is an approximation and should be improved with region geocoding
        locationBias = {
          rectangle: {
            low: {
              latitude: 0,
              longitude: 0
            },
            high: {
              latitude: 90,
              longitude: 180
            }
          }
        };
        console.log(`Set approximate location bias for region: ${region}`);
      } catch (e) {
        console.warn('Could not create location bias for region:', region, e);
      }
    }

    // Set country restriction if we have a valid code
    if (countryCode) {
      // FIXED: Using the correct field name 'countries' instead of 'includedCountries'
      locationRestriction = { 
        countries: [countryCode] 
      };
      console.log(`Set location restriction to country: ${countryCode}`);
    } else {
      console.log('No country code available for location restriction');
    }

    // Prepare the field mask for the types of data we want returned
    const fieldMask = [
      'places.displayName',
      'places.formattedAddress',
      'places.id',
      'places.location',
      'places.types',
      'places.websiteUri',
      'places.rating',
      'places.userRatingCount',
      'places.internationalPhoneNumber',
      'places.priceLevel',
      'places.regularOpeningHours'
    ].join(',');

    // Configure the request body
    const searchBody = {
      textQuery: query,
      maxResultCount: limit,
      languageCode: "en",
    };

    // Only add location bias if it exists
    if (locationBias) {
      searchBody.locationBias = locationBias;
    }

    // Only add location restriction if it exists
    if (locationRestriction) {
      searchBody.locationRestriction = locationRestriction;
    }

    console.log('Sending Places API request with:', {
      url: searchUrl,
      query: query,
      limit: limit,
      startIndex: startIndex,
      country: country,
      countryCode: countryCode,
      region: region,
      locationBias: locationBias ? 'Configured' : 'Not set',
      locationRestriction: locationRestriction ? 'Configured' : 'Not set',
      bodyKeys: Object.keys(searchBody)
    });

    // Prepare the API request
    const requestInit = JSON.parse(JSON.stringify({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': fieldMask
      },
      body: JSON.stringify(searchBody)
    }));

    // Make the API call to Google Places
    const response = await fetch(searchUrl, requestInit);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Places API error (${response.status}): ${errorText}\n\n`);
      return new Response(
        JSON.stringify({ 
          error: `Google Places API returned ${response.status}`,
          status: 'api_error',
          details: errorText
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    const searchResponse = await response.json();
    console.log(`Places API returned ${searchResponse.places?.length || 0} results`);

    // Process and format the results
    const results = [];
    const hasMore = false; // Places API doesn't support pagination in this endpoint
    
    if (searchResponse.places && searchResponse.places.length > 0) {
      for (const place of searchResponse.places) {
        if (!place.websiteUri) {
          console.log(`Skipping place with no website: ${place.displayName?.text || 'Unknown'}`);
          continue; // Skip places without websites
        }

        try {
          // Extract relevant details
          const result = {
            url: place.websiteUri,
            title: place.displayName?.text || '',
            description: place.formattedAddress || '',
            details: {
              title: place.displayName?.text || '',
              description: place.formattedAddress || '',
              lastChecked: new Date().toISOString(),
              phone: place.internationalPhoneNumber || null,
              rating: place.rating || null,
              reviewCount: place.userRatingCount || null,
              businessType: place.types?.length > 0 ? place.types[0] : null,
              priceLevel: place.priceLevel || null,
              openingHours: place.regularOpeningHours?.weekdayDescriptions || null,
              location: place.location ? {
                latitude: place.location.latitude,
                longitude: place.location.longitude
              } : null
            }
          };
          
          results.push(result);
        } catch (e) {
          console.error('Error processing place:', e);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        results,
        hasMore,
        status: 'success',
        meta: {
          query,
          country,
          region,
          totalFound: results.length
        }
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error processing search request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process search request',
        details: error.message || 'Unknown error',
        status: 'server_error'
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
};

Deno.serve(handler);
