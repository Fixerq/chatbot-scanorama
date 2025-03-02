
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Enhanced coordinates for all US states
const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "default": { lat: 37.0902, lng: -95.7129 }, // Center of USA
  "alabama": { lat: 32.7794, lng: -86.8287 },
  "alaska": { lat: 64.0685, lng: -152.2782 },
  "arizona": { lat: 34.2744, lng: -111.6602 },
  "arkansas": { lat: 34.8938, lng: -92.4426 },
  "california": { lat: 36.7783, lng: -119.4179 },
  "colorado": { lat: 39.5501, lng: -105.7821 },
  "connecticut": { lat: 41.6032, lng: -73.0877 },
  "delaware": { lat: 38.9896, lng: -75.5050 },
  "florida": { lat: 27.9944, lng: -81.7603 },
  "georgia": { lat: 32.1656, lng: -82.9001 },
  "hawaii": { lat: 19.8968, lng: -155.5828 },
  "idaho": { lat: 44.0682, lng: -114.7420 },
  "illinois": { lat: 40.0417, lng: -89.1965 },
  "indiana": { lat: 39.8647, lng: -86.2604 },
  "iowa": { lat: 42.0046, lng: -93.2140 },
  "kansas": { lat: 38.5266, lng: -96.7265 },
  "kentucky": { lat: 37.5347, lng: -85.3021 },
  "louisiana": { lat: 31.1695, lng: -91.8678 },
  "maine": { lat: 44.6074, lng: -69.3977 },
  "maryland": { lat: 39.0458, lng: -76.6413 },
  "massachusetts": { lat: 42.2373, lng: -71.5314 },
  "michigan": { lat: 44.3148, lng: -85.6024 },
  "minnesota": { lat: 46.2807, lng: -94.3053 },
  "mississippi": { lat: 32.7673, lng: -89.6812 },
  "missouri": { lat: 38.4623, lng: -92.3020 },
  "montana": { lat: 46.8797, lng: -110.3626 },
  "nebraska": { lat: 41.4925, lng: -99.9018 },
  "nevada": { lat: 38.8026, lng: -116.4194 },
  "new hampshire": { lat: 43.1939, lng: -71.5724 },
  "new jersey": { lat: 40.0583, lng: -74.4057 },
  "new mexico": { lat: 34.5199, lng: -105.8701 },
  "new york": { lat: 42.1657, lng: -74.9481 },
  "north carolina": { lat: 35.7596, lng: -79.0193 },
  "north dakota": { lat: 47.5515, lng: -101.0020 },
  "ohio": { lat: 40.4173, lng: -82.9071 },
  "oklahoma": { lat: 35.5376, lng: -96.9247 },
  "oregon": { lat: 43.8041, lng: -120.5542 },
  "pennsylvania": { lat: 40.5773, lng: -77.2640 },
  "rhode island": { lat: 41.6772, lng: -71.5101 },
  "south carolina": { lat: 33.8191, lng: -80.9066 },
  "south dakota": { lat: 43.9695, lng: -99.9018 },
  "tennessee": { lat: 35.7478, lng: -86.6923 },
  "texas": { lat: 31.9686, lng: -99.9018 },
  "utah": { lat: 39.3210, lng: -111.0937 },
  "vermont": { lat: 44.5588, lng: -72.5778 },
  "virginia": { lat: 37.7693, lng: -78.1700 },
  "washington": { lat: 47.7511, lng: -120.7401 },
  "west virginia": { lat: 38.5976, lng: -80.4549 },
  "wisconsin": { lat: 43.7844, lng: -88.7879 },
  "wyoming": { lat: 43.0760, lng: -107.2903 }
};

// Country codes for regional restrictions
const COUNTRY_CODES: Record<string, string> = {
  "United States": "US",
  "Canada": "CA",
  "United Kingdom": "GB",
  "Australia": "AU",
  "New Zealand": "NZ",
  "Ireland": "IE",
  "US": "US",
  "UK": "GB",
  "USA": "US",
  "England": "GB",
  "Scotland": "GB",
  "Wales": "GB",
  "Northern Ireland": "GB"
};

// Replace problematic phrases in the query
function sanitizeQuery(query: string): string {
  // Remove phrases that don't work well with the Places API
  const replacements = [
    { pattern: /\bnear me\b/gi, replacement: "" },
    { pattern: /\bin my area\b/gi, replacement: "" },
    { pattern: /\bnearby\b/gi, replacement: "" }
  ];
  
  let result = query;
  for (const { pattern, replacement } of replacements) {
    result = result.replace(pattern, replacement);
  }
  
  // Trim excess whitespace and ensure the query is not too long
  result = result.replace(/\s+/g, ' ').trim();
  
  // If the query becomes too short after sanitization, return the original
  if (result.length < 3) {
    return query;
  }
  
  return result;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  
  try {
    // Parse request body
    const requestData = await req.json();
    const {
      query,
      country = "United States",
      region = "",
      include_details = true,
      limit = 10,
      client_timestamp
    } = requestData;
    
    const startIndex = requestData.startIndex || 0;
    
    // Input validation
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid query parameter', status: 'input_error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Log the request with timestamp for correlation
    console.log(`Processing Places request at ${new Date().toISOString()}`);
    console.log(`Client timestamp: ${client_timestamp || 'Not provided'}`);
    console.log(`Search params:`, { query, country, region, startIndex, limit });
    
    // Get the Google Places API key from environment variables
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      console.error("Missing Google Places API key");
      return new Response(
        JSON.stringify({ 
          error: 'API key configuration error', 
          status: 'config_error',
          details: 'Google Places API key is missing'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Sanitize and prepare the query
    const sanitizedQuery = sanitizeQuery(query);
    console.log(`Sanitized query: "${sanitizedQuery}"`);
    
    // Determine the appropriate API URL (using Places API v1)
    const apiUrl = "https://places.googleapis.com/v1/places:searchText";
    
    // Set up location bias based on region and country
    // Convert region to lowercase for matching
    const regionLower = region.toLowerCase();
    
    // Prepare request body
    const requestBody: any = {
      textQuery: sanitizedQuery,
      maxResultCount: Math.min(20, limit || 10), // Ensure we don't exceed API limit of 20
      languageCode: "en",
    };
    
    // Add location bias with increased radius (200km instead of 50km)
    // This allows for a wider search area to get more results
    if (regionLower) {
      const regionCoords = REGION_COORDINATES[regionLower] || REGION_COORDINATES.default;
      console.log(`Using coordinates for region "${regionLower}":`, regionCoords);
      
      requestBody.locationBias = {
        circle: {
          center: {
            latitude: regionCoords.lat,
            longitude: regionCoords.lng
          },
          radius: 200000 // 200km radius (increased from 50km)
        }
      };
    }
    
    // Add country restriction if country is provided
    if (country) {
      const countryCode = COUNTRY_CODES[country] || country;
      console.log(`Set location restriction to country: ${countryCode}`);
      
      requestBody.locationRestriction = {
        countryRestriction: {
          allowedCountries: [countryCode]
        }
      };
    }
    
    // Enhanced field mask to include all relevant fields
    // This helps us get more comprehensive details about each place
    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.websiteUri",
      "places.businessStatus",
      "places.userRatingCount", 
      "places.googleMapsUri",
      "places.nationalPhoneNumber",
      "places.priceLevel",
      "places.rating",
      "places.shortFormattedAddress",
      "places.types",
      "places.internationalPhoneNumber",
      "places.primaryTypeDisplayName",
      "places.regularOpeningHours",
      "places.photos",
      "places.plusCode"
    ].join(",");
    
    // Make the API request
    console.log(`Making Google Places API request to ${apiUrl}`);
    console.log(`Request body:`, JSON.stringify(requestBody));
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`Places API responded in ${responseTime}ms with status ${response.status}`);
    
    if (!response.ok) {
      // Get details from the error response
      let errorDetails = "Unknown error";
      try {
        const errorResponse = await response.json();
        errorDetails = JSON.stringify(errorResponse);
        console.error("Google Places API error:", errorDetails);
      } catch (e) {
        errorDetails = await response.text();
        console.error("Failed to parse error response:", errorDetails);
      }
      
      // Handle rate limiting specifically
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limited by Google Places API', 
            status: 'rate_limited',
            retryAfter: parseInt(response.headers.get('Retry-After') || '60')
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Google Places API error: ${response.status}`, 
          status: 'api_error',
          details: errorDetails
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Process the response
    const data = await response.json();
    console.log(`Places API returned ${data.places?.length || 0} places`);
    
    if (!data.places || !Array.isArray(data.places)) {
      console.log("No places found in API response");
      return new Response(
        JSON.stringify({ results: [], hasMore: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Process each place to extract relevant information
    const results = data.places.map((place: any) => {
      // Extract the business name
      const name = place.displayName?.text || "Unknown Business";
      console.log(`Processing place: ${name}`);
      
      // Get website URL if available, or use a placeholder
      const websiteUrl = place.websiteUri || "https://example.com/no-website";
      
      // Include additional details for enhanced verification
      const details = {
        title: name,
        description: place.formattedAddress || place.shortFormattedAddress || "",
        placeId: place.id,
        phone: place.nationalPhoneNumber || place.internationalPhoneNumber,
        rating: place.rating,
        reviewCount: place.userRatingCount,
        businessType: place.primaryTypeDisplayName?.text || (place.types && place.types[0]) || "Business",
        priceLevel: place.priceLevel,
        location: {
          address: place.formattedAddress,
          latitude: place.location?.latitude,
          longitude: place.location?.longitude
        },
        googleMapsUrl: place.googleMapsUri,
        openingHours: place.regularOpeningHours,
        photoReference: place.photos && place.photos.length > 0 ? place.photos[0].name : null
      };
      
      return {
        url: websiteUrl,
        title: name,
        details
      };
    });
    
    // Determine if there are more results available
    // In the Places API v1, we need to check if we received the maximum number of results
    // If we got maxResultCount, it's likely there are more results
    const hasMore = data.places.length >= requestBody.maxResultCount;
    
    // Return the formatted results
    const responseObj = {
      results,
      hasMore,
      requestParams: {
        query: sanitizedQuery,
        region: region,
        country: country
      },
      nextPageToken: data.nextPageToken
    };
    
    console.log(`Returning ${results.length} processed results with hasMore=${hasMore}`);
    console.log(`Total request processing time: ${Date.now() - startTime}ms`);
    
    // Return the response
    return new Response(
      JSON.stringify(responseObj),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({
        error: `Internal server error: ${error.message}`,
        status: 'server_error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
