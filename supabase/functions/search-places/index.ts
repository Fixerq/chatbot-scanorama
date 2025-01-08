import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const GOOGLE_API_KEY = Deno.env.get('Google API');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  country: string;
  region: string;
  startIndex?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    if (!GOOGLE_API_KEY) {
      console.error('Google API key not found in environment variables');
      throw new Error('Google API key is not configured');
    }

    const { query, country, region } = await req.json() as SearchRequest;
    console.log('Received search request:', { query, country, region });

    // Build location query
    let locationQuery = query;
    if (region && country) {
      locationQuery = `${query} in ${region}, ${country}`;
    } else if (country) {
      locationQuery = `${query} in ${country}`;
    }
    
    console.log('Using search query:', locationQuery);

    // Get country code for components parameter
    const countryCode = getCountryCode(country);
    
    const searchUrl = 'https://places.googleapis.com/v1/places:searchText';
    console.log('Making Places API request to:', searchUrl);

    const requestBody = {
      textQuery: locationQuery,
      languageCode: 'en',
      ...(countryCode && { 
        locationRestriction: { 
          rectangle: getCountryBounds(countryCode) 
        }
      })
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.id'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!searchResponse.ok) {
      console.error('Places API error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
      });
      
      const errorText = await searchResponse.text();
      console.error('Error response:', errorText);
      
      throw new Error(`Places API error: ${searchResponse.statusText} - ${errorText}`);
    }

    const searchData = await searchResponse.json();
    console.log('Places API response:', searchData);

    if (!searchData.places) {
      console.log('No places found in response:', searchData);
      return new Response(
        JSON.stringify({
          results: [],
          hasMore: false
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Format the results
    const validResults = searchData.places
      .filter((place: any) => place.websiteUri)
      .map((place: any) => ({
        url: place.websiteUri,
        details: {
          title: place.displayName?.text || 'Unknown Business',
          description: place.formattedAddress || '',
          lastChecked: new Date().toISOString()
        }
      }));

    console.log(`Found ${validResults.length} businesses with websites`);

    return new Response(
      JSON.stringify({
        results: validResults,
        hasMore: validResults.length >= 10
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in search-places function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined,
        results: [],
        hasMore: false
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});

// Helper function to get country code
function getCountryCode(country: string): string | null {
  const countryMap: { [key: string]: string } = {
    'United States': 'US',
    'United Kingdom': 'GB',
    'Canada': 'CA',
    'Australia': 'AU',
    'Germany': 'DE',
    'France': 'FR',
    'Spain': 'ES',
    'Italy': 'IT',
    'Japan': 'JP',
    'Brazil': 'BR',
    'India': 'IN',
    'China': 'CN',
    'Singapore': 'SG',
    'Netherlands': 'NL',
    'Sweden': 'SE'
  };

  return countryMap[country] || null;
}

// Helper function to get approximate country bounds
function getCountryBounds(countryCode: string) {
  // Approximate bounds for countries using the correct field names for the Places API
  const bounds: { [key: string]: { highLat: number; lowLat: number; highLng: number; lowLng: number } } = {
    'US': { lowLat: 24.396308, lowLng: -125.000000, highLat: 49.384358, highLng: -66.934570 },
    'GB': { lowLat: 49.674, lowLng: -8.649, highLat: 61.061, highLng: 1.762 },
    'CA': { lowLat: 41.676, lowLng: -141.001, highLat: 83.111, highLng: -52.619 },
    'AU': { lowLat: -43.644, lowLng: 112.911, highLat: -10.706, highLng: 153.639 },
    // Add more countries as needed
  };

  return bounds[countryCode] || {
    lowLat: -90,
    lowLng: -180,
    highLat: 90,
    highLng: 180
  };
}