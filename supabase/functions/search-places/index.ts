import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

// Enhanced coordinates for all US states
const US_STATE_COORDINATES = {
  "Alabama": { lat: 32.806671, lng: -86.791130 },
  "Alaska": { lat: 61.370716, lng: -152.404419 },
  "Arizona": { lat: 33.729759, lng: -111.431221 },
  "Arkansas": { lat: 34.969704, lng: -92.373123 },
  "California": { lat: 36.116203, lng: -119.681564 },
  "Colorado": { lat: 39.059811, lng: -105.311104 },
  "Connecticut": { lat: 41.597782, lng: -72.755371 },
  "Delaware": { lat: 39.318523, lng: -75.507141 },
  "Florida": { lat: 27.766279, lng: -81.686783 },
  "Georgia": { lat: 33.040619, lng: -83.643074 },
  "Hawaii": { lat: 21.094318, lng: -157.498337 },
  "Idaho": { lat: 44.240459, lng: -114.788673 },
  "Illinois": { lat: 40.349457, lng: -88.986137 },
  "Indiana": { lat: 39.849426, lng: -86.258278 },
  "Iowa": { lat: 42.011581, lng: -93.210526 },
  "Kansas": { lat: 38.526600, lng: -96.726486 },
  "Kentucky": { lat: 37.668140, lng: -84.670067 },
  "Louisiana": { lat: 31.169546, lng: -91.867805 },
  "Maine": { lat: 44.693947, lng: -69.381927 },
  "Maryland": { lat: 39.063946, lng: -76.802101 },
  "Massachusetts": { lat: 42.230171, lng: -71.530106 },
  "Michigan": { lat: 43.326618, lng: -84.536095 },
  "Minnesota": { lat: 45.694454, lng: -93.900192 },
  "Mississippi": { lat: 32.741646, lng: -89.678696 },
  "Missouri": { lat: 38.456085, lng: -92.288368 },
  "Montana": { lat: 46.921925, lng: -110.454834 },
  "Nebraska": { lat: 41.125370, lng: -98.268082 },
  "Nevada": { lat: 38.313515, lng: -117.055374 },
  "New Hampshire": { lat: 43.452492, lng: -71.563896 },
  "New Jersey": { lat: 40.298904, lng: -74.521011 },
  "New Mexico": { lat: 34.840515, lng: -106.248482 },
  "New York": { lat: 42.165726, lng: -74.948051 },
  "North Carolina": { lat: 35.630066, lng: -79.806427 },
  "North Dakota": { lat: 47.528912, lng: -99.784012 },
  "Ohio": { lat: 40.388783, lng: -82.764915 },
  "Oklahoma": { lat: 35.565342, lng: -96.928917 },
  "Oregon": { lat: 44.572021, lng: -122.070938 },
  "Pennsylvania": { lat: 40.590752, lng: -77.209755 },
  "Rhode Island": { lat: 41.680893, lng: -71.511780 },
  "South Carolina": { lat: 33.856892, lng: -80.945007 },
  "South Dakota": { lat: 44.299782, lng: -99.438828 },
  "Tennessee": { lat: 35.747845, lng: -86.692314 },
  "Texas": { lat: 31.054487, lng: -97.563461 },
  "Utah": { lat: 40.150032, lng: -111.862434 },
  "Vermont": { lat: 44.045876, lng: -72.710686 },
  "Virginia": { lat: 37.769337, lng: -78.169968 },
  "Washington": { lat: 47.400902, lng: -121.490494 },
  "West Virginia": { lat: 38.491226, lng: -80.954453 },
  "Wisconsin": { lat: 44.268543, lng: -89.616508 },
  "Wyoming": { lat: 42.755966, lng: -107.302490 }
};

// Clean user input to prevent malformed queries
function sanitizeQuery(query: string): string {
  // Remove special characters that might cause issues with the Places API
  const cleaned = query.replace(/[^\w\s,.-]/gi, ' ').trim();
  // Replace multiple spaces with a single space
  return cleaned.replace(/\s+/g, ' ');
}

// Helper function to cache place results
async function cacheSearchResults(supabase, query, country, region, results) {
  try {
    const { error } = await supabase.from('cached_places').insert({
      query,
      country,
      region,
      results,
      last_accessed: new Date().toISOString()
    }).select();
    
    if (error) {
      console.error('Error caching places results:', error);
    }
  } catch (err) {
    console.error('Exception caching places results:', err);
  }
}

// Check for cached results
async function getCachedResults(supabase, query, country, region) {
  try {
    const { data, error } = await supabase
      .from('cached_places')
      .select('*')
      .eq('query', query)
      .eq('country', country)
      .eq('region', region)
      .order('last_accessed', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error fetching cached places:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      // Update last accessed time
      await supabase
        .from('cached_places')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', data[0].id);
      
      return data[0].results;
    }
    
    return null;
  } catch (err) {
    console.error('Exception fetching cached places:', err);
    return null;
  }
}

// Error handler to standardize error responses
function handleError(error: any, statusCode = 500) {
  console.error('Places API Error:', error);
  
  const errorMessage = error?.message || 'Unknown error occurred';
  const errorDetails = error?.details || {};
  
  return new Response(
    JSON.stringify({
      status: 'error',
      error: errorMessage,
      details: errorDetails
    }),
    {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

// Perform the actual search using Google Places API
async function searchPlaces(query, country, region, startIndex = 0, limit = 20) {
  // Get the Google API key from environment variable
  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  
  if (!apiKey) {
    throw new Error('Google Places API key is not configured');
  }

  // Add region-specific coordinates if available (for US states)
  let locationBias = '';
  if (country === 'United States' && region && US_STATE_COORDINATES[region]) {
    const coords = US_STATE_COORDINATES[region];
    // Create a rectangle around the state's center point (approximately covering the state)
    locationBias = `&locationRestriction=rectangle:${coords.lat - 2},${coords.lng - 2}|${coords.lat + 2},${coords.lng + 2}`;
  } else {
    // Default to using country as location bias
    locationBias = country ? `&locationBias=country:${getCountryCode(country)}` : '';
  }

  // Build the Places API URL with appropriate parameters
  const sanitizedQuery = sanitizeQuery(query);
  console.log(`Sanitized query: "${sanitizedQuery}"`);
  
  // Request more fields to get better data
  const fields = 'name,formatted_address,business_status,types,place_id,photos,opening_hours,rating,user_ratings_total,website,price_level,geometry';
  
  const url = `https://places.googleapis.com/v1/places:searchText?textQuery=${encodeURIComponent(sanitizedQuery)}&maxResultCount=${limit}${locationBias}&languageCode=en&offset=${startIndex}&fields=${fields}`;
  
  console.log(`Places API URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fields
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Places API Error (${response.status}):`, errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        throw {
          message: `Google Places API error: ${errorJson.error?.message || 'Unknown error'}`,
          status: response.status,
          details: errorJson
        };
      } catch (e) {
        throw {
          message: `Google Places API error: ${errorText || response.statusText}`,
          status: response.status
        };
      }
    }
    
    const data = await response.json();
    console.log(`Places API returned ${data.places?.length || 0} results`);
    
    return processResults(data, startIndex, limit);
  } catch (error) {
    console.error('Error calling Places API:', error);
    throw error;
  }
}

// Process and format search results
function processResults(data, startIndex, limit) {
  if (!data || !data.places) {
    return { results: [], hasMore: false };
  }
  
  const places = data.places || [];
  
  const results = places.map(place => {
    // Extract and format all relevant information
    const website = place.websiteUri || 'https://example.com/no-website';
    
    return {
      title: place.displayName?.text || 'Unknown Business',
      url: website,
      description: place.formattedAddress || '',
      details: {
        title: place.displayName?.text || 'Unknown Business',
        description: place.formattedAddress || '',
        phone: place.internationalPhoneNumber || '',
        placeId: place.id || '',
        rating: place.rating,
        reviewCount: place.userRatingCount,
        businessType: place.types?.[0] || '',
        priceLevel: place.priceLevel,
        openingHours: place.currentOpeningHours ? {
          open: place.currentOpeningHours.openNow || false,
          periods: place.currentOpeningHours.periods || []
        } : null,
        location: place.location ? {
          lat: place.location.latitude,
          lng: place.location.longitude
        } : null,
        photoReference: place.photos?.[0]?.name || null,
      }
    };
  });
  
  // Determine if there are more results
  const hasMore = data.nextPageToken || results.length >= limit;
  
  return { 
    results, 
    hasMore,
    nextPageToken: data.nextPageToken
  };
}

// Helper function to get country code for location bias
function getCountryCode(country) {
  const countryCodes = {
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
  
  return countryCodes[country] || '';
}

// Create a Supabase client using the environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { query, country, region, startIndex = 0, limit = 20, include_details = true } = await req.json();
    
    // Validate required parameters
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Search params:', { query, country, region, startIndex, limit });
    
    // Check for cached results first
    let results = null;
    const cacheKey = `${query}_${country}_${region}`;
    
    if (startIndex === 0) {
      results = await getCachedResults(supabase, cacheKey, country, region);
      
      if (results) {
        console.log('Using cached results for:', cacheKey);
        return new Response(
          JSON.stringify(results),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // If no cached results or pagination request, perform search
    try {
      results = await searchPlaces(query, country, region, startIndex, limit);
      
      // Cache the results if it's the first page
      if (startIndex === 0) {
        await cacheSearchResults(supabase, cacheKey, country, region, results);
      }
      
      return new Response(
        JSON.stringify(results),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      // Specific handling for common Places API errors
      if (error.status === 400) {
        return handleError({ 
          message: 'Invalid search parameters', 
          details: error.details || error.message 
        }, 400);
      } else if (error.status === 403) {
        return handleError({ 
          message: 'API key error or quota exceeded',
          details: error.details || error.message  
        }, 403);
      } else if (error.message?.includes('API key')) {
        return handleError({ 
          message: 'Google Places API key is missing or invalid',
          details: { status: 'config_error', error: error.message }
        }, 500);
      } else {
        return handleError(error);
      }
    }
  } catch (error) {
    console.error('General error:', error);
    return handleError({ 
      message: 'Internal server error',
      details: error.toString()
    });
  }
});
