
import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

interface SearchRequest {
  query: string;
  country: string;
  region?: string;
  startIndex?: number;
  limit?: number;
  include_details?: boolean;
  client_timestamp?: string;
}

// Enhanced coordinates map with all US states and more countries
const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // United States - all states
  "Alabama": { lat: 32.7794, lng: -86.8287 },
  "Alaska": { lat: 64.0685, lng: -152.2782 },
  "Arizona": { lat: 34.2744, lng: -111.6602 },
  "Arkansas": { lat: 34.8938, lng: -92.4426 },
  "California": { lat: 36.7783, lng: -119.4179 },
  "Colorado": { lat: 39.5501, lng: -105.7821 },
  "Connecticut": { lat: 41.6032, lng: -73.0877 },
  "Delaware": { lat: 38.9896, lng: -75.5050 },
  "Florida": { lat: 27.9944, lng: -81.7603 },
  "Georgia": { lat: 32.6415, lng: -83.4426 },
  "Hawaii": { lat: 20.2927, lng: -156.3737 },
  "Idaho": { lat: 44.0682, lng: -114.7420 },
  "Illinois": { lat: 40.0417, lng: -89.1965 },
  "Indiana": { lat: 39.8942, lng: -86.2816 },
  "Iowa": { lat: 42.0751, lng: -93.4960 },
  "Kansas": { lat: 38.4937, lng: -98.3804 },
  "Kentucky": { lat: 37.5347, lng: -85.3021 },
  "Louisiana": { lat: 31.0689, lng: -91.9968 },
  "Maine": { lat: 45.3695, lng: -69.2428 },
  "Maryland": { lat: 39.0550, lng: -76.7909 },
  "Massachusetts": { lat: 42.2596, lng: -71.8083 },
  "Michigan": { lat: 44.3467, lng: -85.4102 },
  "Minnesota": { lat: 46.2807, lng: -94.3053 },
  "Mississippi": { lat: 32.7364, lng: -89.6678 },
  "Missouri": { lat: 38.3566, lng: -92.4580 },
  "Montana": { lat: 47.0527, lng: -109.6333 },
  "Nebraska": { lat: 41.5378, lng: -99.7951 },
  "Nevada": { lat: 39.3289, lng: -116.6312 },
  "New Hampshire": { lat: 43.6805, lng: -71.5811 },
  "New Jersey": { lat: 40.1907, lng: -74.6728 },
  "New Mexico": { lat: 34.4071, lng: -106.1126 },
  "New York": { lat: 42.9538, lng: -75.5268 },
  "North Carolina": { lat: 35.5557, lng: -79.3877 },
  "North Dakota": { lat: 47.4501, lng: -100.4659 },
  "Ohio": { lat: 40.2862, lng: -82.7937 },
  "Oklahoma": { lat: 35.5889, lng: -97.4943 },
  "Oregon": { lat: 43.9336, lng: -120.5583 },
  "Pennsylvania": { lat: 40.8781, lng: -77.7996 },
  "Rhode Island": { lat: 41.6762, lng: -71.5562 },
  "South Carolina": { lat: 33.9169, lng: -80.8964 },
  "South Dakota": { lat: 44.4443, lng: -100.2263 },
  "Tennessee": { lat: 35.8580, lng: -86.3505 },
  "Texas": { lat: 31.4757, lng: -99.3312 },
  "Utah": { lat: 39.3055, lng: -111.6703 },
  "Vermont": { lat: 44.0687, lng: -72.6658 },
  "Virginia": { lat: 37.5215, lng: -78.8537 },
  "Washington": { lat: 47.3826, lng: -120.4472 },
  "West Virginia": { lat: 38.6409, lng: -80.6227 },
  "Wisconsin": { lat: 44.6243, lng: -89.9941 },
  "Wyoming": { lat: 42.9957, lng: -107.5512 },
  
  // United Kingdom
  "England": { lat: 52.3555, lng: -1.1743 },
  "Scotland": { lat: 56.4907, lng: -4.2026 },
  "Wales": { lat: 52.1307, lng: -3.7837 },
  "Northern Ireland": { lat: 54.7877, lng: -6.4923 },

  // Canada
  "Alberta": { lat: 53.9333, lng: -116.5765 },
  "British Columbia": { lat: 53.7267, lng: -127.6476 },
  "Manitoba": { lat: 53.7609, lng: -98.8139 },
  "New Brunswick": { lat: 46.5653, lng: -66.4619 },
  "Newfoundland and Labrador": { lat: 53.1355, lng: -57.6604 },
  "Nova Scotia": { lat: 45.1969, lng: -63.1553 },
  "Ontario": { lat: 51.2538, lng: -85.3232 },
  "Prince Edward Island": { lat: 46.5107, lng: -63.4168 },
  "Quebec": { lat: 52.9399, lng: -73.5491 },
  "Saskatchewan": { lat: 52.9399, lng: -106.4509 },
  "Northwest Territories": { lat: 64.8255, lng: -124.8457 },
  "Nunavut": { lat: 70.2998, lng: -83.1076 },
  "Yukon": { lat: 64.2823, lng: -135.0 },
  
  // Australia
  "New South Wales": { lat: -31.2532, lng: 146.9211 },
  "Victoria": { lat: -37.0201, lng: 144.9646 },
  "Queensland": { lat: -20.9176, lng: 142.7028 },
  "Western Australia": { lat: -27.6728, lng: 121.6283 },
  "South Australia": { lat: -30.0002, lng: 136.2092 },
  "Tasmania": { lat: -41.4545, lng: 145.9707 },
  "Australian Capital Territory": { lat: -35.4735, lng: 149.0124 },
  "Northern Territory": { lat: -19.4914, lng: 132.5510 },

  // Default fallback for unknown regions
  "default": { lat: 0, lng: 0 }
};

// Country code mapping
const COUNTRY_CODES: Record<string, string> = {
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

// Helper function to sanitize queries for better results
const sanitizeQuery = (query: string): string => {
  // Remove problematic phrases like "near me" which don't work well with Places API
  return query.replace(/\bnear me\b/gi, '').trim();
};

// Enhanced field mask for better place details
const getFieldMask = (includeDetails: boolean): string[] => {
  const basicFields = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.websiteUri',
  ];
  
  if (includeDetails) {
    return [
      ...basicFields,
      'places.shortFormattedAddress',
      'places.location',
      'places.types',
      'places.businessStatus',
      'places.userRatingCount',
      'places.googleMapsUri',
      'places.nationalPhoneNumber',
      'places.internationalPhoneNumber',
      'places.rating',
      'places.regularOpeningHours',
      'places.priceLevel',
      'places.primaryType',
      'places.primaryTypeDisplayName'
    ];
  }
  
  return basicFields;
};

Deno.serve(async (req) => {
  // Handle CORS pre-flight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract Google Places API key from environment
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!GOOGLE_API_KEY) {
      console.error('Google Places API key is missing');
      return new Response(
        JSON.stringify({
          error: 'Missing API key',
          status: 'config_error',
          details: 'Google Places API key not found in environment variables'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    const { query, country, region, startIndex = 0, limit = 20, include_details = true, client_timestamp } = await req.json() as SearchRequest;
    const sanitizedQuery = sanitizeQuery(query);
    
    // Log request parameters for debugging
    console.log(`Search request received at ${new Date().toISOString()}`);
    console.log(`Original query: "${query}"`);
    console.log(`Sanitized query: "${sanitizedQuery}"`);
    console.log(`Country: ${country}, Region: ${region}, StartIndex: ${startIndex}, Limit: ${limit}`);
    
    if (client_timestamp) {
      console.log(`Client timestamp: ${client_timestamp}`);
    }
    
    // Check for required parameters
    if (!sanitizedQuery || sanitizedQuery.length < 3) {
      return new Response(
        JSON.stringify({
          error: 'Invalid query',
          details: 'Query must be at least 3 characters'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Use country code for location restriction
    const countryCode = COUNTRY_CODES[country] || country;
    if (countryCode) {
      console.log(`Set location restriction to country: ${countryCode}`);
    }

    // Larger radius (150km instead of 50km) for broader search coverage
    const searchRadius = 150000; // 150km in meters
    
    // Prepare request to Google Places API V1
    const requestBody: any = {
      textQuery: sanitizedQuery,
      maxResultCount: Math.min(limit, 20), // API maximum is 20
      languageCode: "en",
      locationBias: {},
      priceLevels: ["PRICE_LEVEL_INEXPENSIVE", "PRICE_LEVEL_MODERATE", "PRICE_LEVEL_EXPENSIVE", "PRICE_LEVEL_VERY_EXPENSIVE"],
      openNow: false,
      includedTypes: [],
    };
    
    // Set field mask based on details flag
    requestBody.fields = {
      paths: getFieldMask(include_details)
    };

    // Add regional bias if region is provided
    if (region) {
      const regionCoords = REGION_COORDINATES[region];
      if (regionCoords) {
        console.log(`Using coordinates for ${region}: lat ${regionCoords.lat}, lng ${regionCoords.lng}`);
        requestBody.locationBias = {
          circle: {
            center: {
              latitude: regionCoords.lat,
              longitude: regionCoords.lng
            },
            radius: searchRadius
          }
        };
      } else {
        console.log(`No specific coordinates found for ${region}, using broader search`);
      }
    }

    // Add country restriction if provided
    if (countryCode) {
      requestBody.locationRestriction = {
        rectangle: {
          low: { latitude: -90, longitude: -180 },
          high: { latitude: 90, longitude: 180 }
        }
      };
      
      // If we have a country code, use it for location restriction
      if (countryCode) {
        requestBody.locationRestriction = {
          includedCountries: [countryCode]
        };
      }
    }

    // Pagination support
    if (startIndex > 0 && startIndex % 20 === 0) {
      // Places API needs a pageToken for pagination, but we'd need to store this between requests
      // This is a limitation we'll need to handle by making multiple requests on the client
      console.log(`Starting from index ${startIndex}, making an offset request`);
    }

    // Call Google Places API
    console.log(`Calling Google Places API with params:`, JSON.stringify(requestBody, null, 2));
    const startTime = Date.now();
    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': requestBody.fields.paths.join(','),
        },
        body: JSON.stringify(requestBody),
      }
    );
    
    const apiResponseTime = Date.now() - startTime;
    console.log(`API response received in ${apiResponseTime}ms with status ${response.status}`);

    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Places API error: ${response.status}`, errorText);
      
      return new Response(
        JSON.stringify({
          error: `Google Places API error: ${response.status}`,
          details: errorText,
          status: 'api_error'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status === 429 ? 429 : 500,
          retryAfter: response.headers.get('retry-after') || "60"
        }
      );
    }

    // Parse successful response
    const data = await response.json();
    
    console.log(`Found ${data.places?.length || 0} places in response`);
    if (data.places?.length > 0) {
      console.log(`Sample result: ${data.places[0].websiteUri || 'No website'} (${data.places[0].id})`);
    }

    // Process results to extract relevant information
    const results = (data.places || []).map((place: any) => {
      const website = place.websiteUri || 'https://example.com/no-website';
      
      console.log(`Processing ${place.displayName?.text || 'Unknown place'} (${website})`);
      
      return {
        url: website,
        title: place.displayName?.text || '',
        description: place.formattedAddress || '',
        details: {
          title: place.displayName?.text || '',
          description: place.formattedAddress || '',
          phone: place.internationalPhoneNumber || place.nationalPhoneNumber,
          rating: place.rating,
          reviewCount: place.userRatingCount,
          businessType: place.primaryTypeDisplayName?.text || place.primaryType,
          priceLevel: place.priceLevel,
          openingHours: place.regularOpeningHours,
          location: place.location,
          placeId: place.id,
          photoReference: null // Places API v1 handles photos differently
        }
      };
    });

    // Check for more results - with Places API v1 we can use nextPageToken
    // For now, we'll use a simple approximation based on the max results
    const hasMore = data.places?.length >= Math.min(limit, 20);
    
    // Construct the final response
    const responseObj = {
      results,
      hasMore,
      nextPageToken: data.nextPageToken
    };

    console.log(`Processed ${results.length} results with hasMore=${hasMore}`);
    console.log(`Request completed in ${Date.now() - startTime}ms`);
    
    return new Response(
      JSON.stringify(responseObj),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`Error processing search-places request:`, error);
    
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
