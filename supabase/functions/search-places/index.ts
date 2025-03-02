import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const GOOGLE_API_KEY = Deno.env.get('Google API');
const MAX_RESULTS = 50; // Increased from 20 to allow more results
const DEFAULT_RADIUS_MILES = 50; // Increased from 20 miles

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  country: string;
  region: string;
  startIndex?: number;
  limit?: number;
  include_details?: boolean;
}

// Basic mapping of regions to approximate coordinates for better location biasing
const regionCoordinates: Record<string, { lat: number; lng: number }> = {
  // US states
  "Delaware": { lat: 39.0, lng: -75.5 },
  "California": { lat: 36.7, lng: -119.4 },
  "New York": { lat: 43.0, lng: -75.0 },
  "Texas": { lat: 31.0, lng: -100.0 },
  "Florida": { lat: 27.8, lng: -81.5 },
  // Add more as needed
};

// Get coordinates for location biasing
const getLocationBias = (country: string, region: string) => {
  if (region && regionCoordinates[region]) {
    return regionCoordinates[region];
  }
  
  // Default coordinates (US centered)
  return { lat: 37.0902, lng: -95.7129 };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, country, region, startIndex = 0, limit = 25, include_details = false } = await req.json() as SearchRequest;
    console.log('Received search request:', { query, country, region, startIndex, limit });

    if (!GOOGLE_API_KEY) {
      console.error('Google API key not found');
      throw new Error('Google API key is not configured');
    }

    // Improve query with business-specific terms for better results
    let locationQuery = query;
    if (region && country) {
      locationQuery = `${query} in ${region}, ${country}`;
    } else if (country) {
      locationQuery = `${query} in ${country}`;
    }
    
    // Add business-specific terms for certain queries
    if (query.toLowerCase().includes('plumber')) {
      locationQuery += ' plumbing services contractors business';
    } else if (query.toLowerCase().includes('electrician')) {
      locationQuery += ' electrical services contractors business';
    }
    
    console.log('Using enhanced search query:', locationQuery);

    // Get location bias coordinates based on region
    const locationBias = getLocationBias(country, region);
    const radiusMeters = DEFAULT_RADIUS_MILES * 1609.34;
    
    // For smaller regions like Delaware, increase search radius
    const adjustedRadius = region && ['Delaware', 'Rhode Island', 'Connecticut'].includes(region)
      ? radiusMeters * 1.5  // 50% larger radius for small states
      : radiusMeters;

    const searchUrl = `https://places.googleapis.com/v1/places:searchText`;
    console.log('Making Places API request with location bias:', { lat: locationBias.lat, lng: locationBias.lng, radius: adjustedRadius });

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.types,places.businessStatus',
      },
      body: JSON.stringify({
        textQuery: locationQuery,
        maxResultCount: MAX_RESULTS,
        locationBias: {
          circle: {
            center: { latitude: locationBias.lat, longitude: locationBias.lng },
            radius: adjustedRadius,
          },
        },
        // Include a language restriction for better results
        languageCode: "en",
      })
    });
    
    if (!searchResponse.ok) {
      console.error('Places API error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText
      });
      throw new Error(`Places API request failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    console.log('Places API response:', {
      totalResults: searchData.places?.length || 0,
      hasPlaces: !!searchData.places,
    });

    if (!searchData.places) {
      console.log('No places found');
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

    // Process results with less restrictive filtering
    let results = searchData.places
      .filter((place: any) => {
        // Include places without websites initially (more results)
        const isBusinessType = place.types?.some((type: string) => 
          ['establishment', 'business', 'store', 'service', 'plumber', 'electrician', 
           'contractor', 'professional', 'point_of_interest', 'local_business'].includes(type)
        );
        
        // Include all businesses, but log what we're filtering
        const hasWebsite = !!place.websiteUri;
        
        console.log(`Place ${place.displayName?.text}: hasWebsite=${hasWebsite}, isBusinessType=${isBusinessType}, types=${place.types?.join(',')}`);
        
        // Return true if it's a business, even without website
        return isBusinessType;
      })
      .map((place: any) => ({
        url: place.websiteUri || '',
        details: {
          title: place.displayName?.text || '',
          description: place.formattedAddress || '',
          lastChecked: new Date().toISOString(),
          // Include more details if requested
          ...(include_details ? {
            placeId: place.id,
            types: place.types,
            hasWebsite: !!place.websiteUri
          } : {})
        }
      }));

    console.log(`Found ${results.length} businesses (with or without websites) out of ${searchData.places.length} total places`);
    
    // Now filter for websites only if we have plenty of results, otherwise keep no-website results
    const websiteResults = results.filter((place: any) => place.url);
    
    if (websiteResults.length > 10) {
      // If we have enough results with websites, filter out the ones without
      results = websiteResults;
      console.log(`Filtered to ${results.length} businesses with websites`);
    } else {
      // Keep all results but add a note for those without websites
      results = results.map((result: any) => ({
        ...result,
        url: result.url || 'https://example.com/no-website',
        details: {
          ...result.details,
          noWebsite: !result.url
        }
      }));
      console.log(`Kept all ${results.length} businesses, some without websites`);
    }

    // Handle pagination
    const paginatedResults = startIndex > 0 
      ? results.slice(startIndex, startIndex + limit)
      : results.slice(0, limit);

    return new Response(
      JSON.stringify({
        results: paginatedResults,
        hasMore: results.length > (startIndex + paginatedResults.length)
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
