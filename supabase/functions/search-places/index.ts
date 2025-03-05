import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.1.0'

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

// API key from environment variable
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')

// Country code mappings (full names to ISO codes)
const countryCodeMap = {
  'Australia': 'AU',
  'United States': 'US',
  'United Kingdom': 'GB',
  'Canada': 'CA',
  'New Zealand': 'NZ',
  'India': 'IN',
  'South Africa': 'ZA',
  'Ireland': 'IE',
  'Singapore': 'SG',
  'Malaysia': 'MY',
  'Philippines': 'PH',
  'Hong Kong': 'HK',
  'Japan': 'JP',
  'China': 'CN',
  'Brazil': 'BR',
  'Mexico': 'MX',
  'Germany': 'DE',
  'France': 'FR',
  'Italy': 'IT',
  'Spain': 'ES',
  'Netherlands': 'NL',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI'
};

// Region/state geographic boundaries for location bias
const regionBounds = {
  'AU': { // Australia
    'Western Australia': {
      low: { latitude: -35.13, longitude: 112.92 },
      high: { latitude: -13.68, longitude: 129.00 }
    },
    'Victoria': {
      low: { latitude: -39.16, longitude: 140.96 },
      high: { latitude: -33.98, longitude: 150.00 }
    },
    'New South Wales': {
      low: { latitude: -37.51, longitude: 141.00 },
      high: { latitude: -28.16, longitude: 153.64 }
    },
    'Queensland': {
      low: { latitude: -29.18, longitude: 138.00 },
      high: { latitude: -10.68, longitude: 153.55 }
    },
    'South Australia': {
      low: { latitude: -38.06, longitude: 129.00 },
      high: { latitude: -26.00, longitude: 141.00 }
    },
    'Tasmania': {
      low: { latitude: -43.64, longitude: 143.82 },
      high: { latitude: -39.58, longitude: 148.52 }
    },
    'Northern Territory': {
      low: { latitude: -26.00, longitude: 129.00 },
      high: { latitude: -10.97, longitude: 138.00 }
    },
    'Australian Capital Territory': {
      low: { latitude: -35.92, longitude: 148.76 },
      high: { latitude: -35.12, longitude: 149.40 }
    }
  },
  'US': { // United States
    'California': {
      low: { latitude: 32.53, longitude: -124.48 },
      high: { latitude: 42.01, longitude: -114.13 }
    },
    'New York': {
      low: { latitude: 40.50, longitude: -79.76 },
      high: { latitude: 45.01, longitude: -71.85 }
    },
    'Texas': {
      low: { latitude: 25.84, longitude: -106.65 },
      high: { latitude: 36.50, longitude: -93.51 }
    },
    'Florida': {
      low: { latitude: 24.52, longitude: -87.63 },
      high: { latitude: 31.00, longitude: -80.03 }
    },
    'Connecticut': {
      low: { latitude: 40.98, longitude: -73.73 },
      high: { latitude: 42.05, longitude: -71.79 }
    },
    'Delaware': {
      low: { latitude: 38.45, longitude: -75.79 },
      high: { latitude: 39.84, longitude: -75.05 }
    }
    // Add other states as needed
  },
  'GB': { // United Kingdom
    'England': {
      low: { latitude: 49.96, longitude: -6.42 },
      high: { latitude: 55.81, longitude: 1.76 }
    },
    'Scotland': {
      low: { latitude: 54.63, longitude: -8.65 },
      high: { latitude: 60.86, longitude: -0.76 }
    },
    'Wales': {
      low: { latitude: 51.35, longitude: -5.47 },
      high: { latitude: 53.44, longitude: -2.65 }
    },
    'Northern Ireland': {
      low: { latitude: 54.01, longitude: -8.18 },
      high: { latitude: 55.34, longitude: -5.43 }
    }
  }
  // Add other countries as needed
};

// Country-specific domain TLDs for filtering
const countryDomains = {
  'AU': ['.au', '.com.au', '.net.au', '.org.au'],
  'US': ['.us', '.com', '.org', '.net', '.edu'],
  'GB': ['.uk', '.co.uk', '.org.uk', '.ac.uk'],
  'CA': ['.ca', '.com.ca', '.org.ca'],
  'NZ': ['.nz', '.co.nz', '.org.nz'],
  'IN': ['.in', '.co.in', '.org.in'],
  'SG': ['.sg', '.com.sg', '.org.sg']
  // Add other countries as needed
};

// Map to distinguish between search fields and response fields
const PLACE_FIELDS = {
  id: 'places.id',
  displayName: 'places.displayName',
  formattedAddress: 'places.formattedAddress',
  websiteUri: 'places.websiteUri',
  internationalPhoneNumber: 'places.internationalPhoneNumber',
  rating: 'places.rating',
  userRatingCount: 'places.userRatingCount',
  primaryType: 'places.primaryType',
  types: 'places.types',
  priceLevel: 'places.priceLevel',
  regularOpeningHours: 'places.regularOpeningHours',
  photos: 'places.photos',
  businessStatus: 'places.businessStatus'
};

// Helper functions
function normalizeCountryCode(country) {
  return countryCodeMap[country] || country;
}

function buildFieldMask(fields = Object.values(PLACE_FIELDS)) {
  return fields.join(',');
}

// Function to fetch multiple pages of results
async function fetchMoreResults(requestBody, apiKey, desiredCount = 30) {
  let allResults = [];
  let nextPageToken = null;
  let pageCount = 0;
  const MAX_PAGES = Math.ceil(desiredCount / 20); // Calculate how many pages we need
  
  do {
    // Add page token if we have one from previous request
    if (nextPageToken) {
      requestBody.pageToken = nextPageToken;
    }
    
    // API URL with key
    const apiUrl = `https://places.googleapis.com/v1/places:searchText?key=${apiKey}`;
    
    console.log(`Making Places API request (page ${pageCount + 1}):`, JSON.stringify(requestBody));
    
    try {
      // Make the API request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-FieldMask': buildFieldMask()
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Places API error:', response.status, errorData);
        throw new Error(`Google Places API error: ${response.status} ${JSON.stringify(errorData)}`);
      }
      
      const responseData = await response.json();
      console.log(`Received ${responseData.places?.length || 0} results from Places API`);
      
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
      
    } catch (error) {
      console.error('Error fetching Places results:', error);
      break;
    }
    
  } while (nextPageToken);
  
  return {
    results: allResults,
    nextPageToken: nextPageToken,
    hasMore: !!nextPageToken
  };
}

// Function to create search variations to get more results
async function fetchWithVariations(baseQuery, country, region, requestBody, apiKey, desiredCount = 60) {
  console.log(`Fetching results with variations for: ${baseQuery}, ${region}, ${country}`);
  
  // Create different search variations
  const variations = [
    baseQuery, // Original query
    `${baseQuery} ${region}`, // Query with region
  ];
  
  // Add more specific variations for service businesses
  if (region) {
    // Get major cities for this region if available
    const cities = getMajorCities(country, region);
    
    if (cities && cities.length > 0) {
      // Add major cities to variations
      cities.forEach(city => {
        variations.push(`${baseQuery} ${city}`);
      });
    } else {
      // If no cities data, add generic variations
      variations.push(`${baseQuery} services ${region}`);
      variations.push(`${baseQuery} business ${region}`);
    }
  }
  
  // For specific business types, add more specific variations
  if (baseQuery.toLowerCase().includes('dentist')) {
    variations.push(`${baseQuery} clinic ${region}`);
    variations.push(`dental clinic ${region}`);
    variations.push(`dental practice ${region}`);
  } else if (baseQuery.toLowerCase().includes('plumber')) {
    variations.push(`plumbing services ${region}`);
    variations.push(`emergency plumber ${region}`);
    variations.push(`${baseQuery} contractor ${region}`);
  }
  
  console.log(`Created ${variations.length} search variations:`, variations);
  
  // Fetch results for each variation
  const allResultsMap = new Map(); // Use a map to track unique place IDs
  let nextPageToken = null;
  let hasMore = false;
  
  for (const variation of variations) {
    // Skip if we've already reached our desired count
    if (allResultsMap.size >= desiredCount) break;
    
    // Create a copy of the request body for this variation
    const variationRequestBody = { ...requestBody, textQuery: variation };
    
    // Fetch results for this variation
    console.log(`Fetching results for variation: "${variation}"`);
    const { results, nextPageToken: token, hasMore: more } = 
      await fetchMoreResults(variationRequestBody, apiKey, Math.min(30, desiredCount - allResultsMap.size));
    
    // Update pagination information
    if (token) nextPageToken = token;
    if (more) hasMore = true;
    
    // Add unique results to our map
    for (const result of results) {
      if (!allResultsMap.has(result.id)) {
        allResultsMap.set(result.id, result);
      }
    }
    
    console.log(`Found ${results.length} results for "${variation}", total unique results: ${allResultsMap.size}`);
    
    // Wait between variations to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Convert map back to array
  const allResults = Array.from(allResultsMap.values());
  
  return {
    results: allResults,
    nextPageToken,
    hasMore
  };
}

// Function to get major cities for a region
function getMajorCities(country, region) {
  const cities = {
    'AU': {
      'Western Australia': ['Perth', 'Fremantle', 'Mandurah', 'Bunbury', 'Geraldton', 'Albany', 'Kalgoorlie'],
      'Victoria': ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Shepparton', 'Mildura', 'Warrnambool'],
      'New South Wales': ['Sydney', 'Newcastle', 'Wollongong', 'Central Coast', 'Coffs Harbour', 'Wagga Wagga'],
      'Queensland': ['Brisbane', 'Gold Coast', 'Sunshine Coast', 'Cairns', 'Townsville', 'Toowoomba', 'Mackay'],
      'South Australia': ['Adelaide', 'Mount Gambier', 'Whyalla', 'Port Lincoln', 'Port Augusta', 'Victor Harbor'],
      'Tasmania': ['Hobart', 'Launceston', 'Devonport', 'Burnie'],
      'Northern Territory': ['Darwin', 'Alice Springs', 'Katherine'],
      'Australian Capital Territory': ['Canberra', 'Queanbeyan']
    },
    'US': {
      'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Fresno'],
      'New York': ['New York City', 'Buffalo', 'Rochester', 'Syracuse', 'Albany'],
      'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso'],
      'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'],
      'Connecticut': ['Hartford', 'New Haven', 'Stamford', 'Bridgeport', 'Waterbury']
    },
    'GB': {
      'England': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Bristol', 'Newcastle'],
      'Scotland': ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Inverness'],
      'Wales': ['Cardiff', 'Swansea', 'Newport', 'Bangor'],
      'Northern Ireland': ['Belfast', 'Derry', 'Newry', 'Armagh']
    }
  };
  
  // Normalize country code
  const countryCode = normalizeCountryCode(country);
  
  // Return cities for this region if available
  if (cities[countryCode] && cities[countryCode][region]) {
    return cities[countryCode][region];
  }
  
  return null;
}

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
    let options;
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
    
    const { 
      query, 
      country, 
      region, 
      pageToken, 
      limit = 20, 
      existingPlaceIds = [] 
    } = options;
    
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
      maxResultCount: Math.min(limit, 20), // Cap at 20 per request
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
    
    // Use search variations to get more results
    try {
      const { results: placesResults, nextPageToken, hasMore } = 
        await fetchWithVariations(query, countryCode, region, requestBody, GOOGLE_API_KEY, pageToken ? 20 : 60);
    
      console.log(`Retrieved ${placesResults.length} results from Google Places API`);
      
      // Process and filter results based on country
      const processResults = () => {
        // First map the raw results to our desired format
        const mappedResults = placesResults.map(place => ({
          id: place.id, // Store Place ID for deduplication
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
        }));
        
        // Filter out directories, gov sites, edu sites, etc.
        const nonServiceKeywords = [
          'directory', 'listing', 'yellow pages', 'whitepages', 'yelp', 'finder',
          'government', 'gov', 'council', 'department', 'authority', 'agency',
          'university', 'education', 'school', 'college', 'academy', 'institute',
          'wikipedia', 'wiki', 'encyclopedia', 'dictionary',
          'news', 'magazine', 'blog', 'forum', 'review site'
        ];
        
        // Filter out non-service businesses based on URL and title
        let serviceResults = mappedResults.filter(result => {
          const url = result.url.toLowerCase();
          const title = result.title.toLowerCase();
          
          // Skip results with common directory/non-service keywords
          const isNonService = nonServiceKeywords.some(keyword => 
            url.includes(keyword) || title.includes(keyword)
          );
          
          // Skip .gov .edu domains and common directory sites
          const isUnwantedDomain = url.includes('.gov') || 
                                  url.includes('.edu') || 
                                  url.includes('yelp.com') ||
                                  url.includes('yellowpages') ||
                                  url.includes('directory.com') ||
                                  url.includes('whitepages.com') ||
                                  url.includes('yell.com') ||
                                  url.includes('trulia.com') ||
                                  url.includes('tripadvisor') ||
                                  url.includes('booking.com');
          
          // Keep only service businesses
          return !isNonService && !isUnwantedDomain;
        });
        
        console.log(`Filtered out ${mappedResults.length - serviceResults.length} non-service results`);
        
        // Filter based on country-specific domains if appropriate
        let filteredResults = serviceResults;
        
        if (countryCode && countryDomains[countryCode]) {
          console.log(`Applying domain filtering for country: ${countryCode}`);
          
          // Group results by whether they match the country's domains
          const preferredDomains = countryDomains[countryCode];
          const otherCountryDomains = Object.entries(countryDomains)
            .filter(([code]) => code !== countryCode)
            .flatMap(([_, domains]) => domains);
          
          // Count matches by domain type
          let preferredDomainCount = 0;
          let otherDomainCount = 0;
          let neutralDomainCount = 0;
          
          filteredResults = serviceResults.filter(result => {
            const url = result.url.toLowerCase();
            
            // Check if URL contains preferred domains
            const hasPreferredDomain = preferredDomains.some(domain => url.includes(domain));
            
            // Check if URL contains domains from other countries
            const hasOtherCountryDomain = otherCountryDomains.some(domain => url.includes(domain));
            
            // Count matches for logging
            if (hasPreferredDomain) preferredDomainCount++;
            else if (hasOtherCountryDomain) otherDomainCount++;
            else neutralDomainCount++;
            
            // Keep all preferred domain results, or neutral results
            // Filter out other country domains unless we don't have enough results
            return hasPreferredDomain || !hasOtherCountryDomain;
          });
          
          console.log(`Domain filtering stats: preferred=${preferredDomainCount}, neutral=${neutralDomainCount}, other=${otherDomainCount}`);
          console.log(`Results after domain filtering: ${filteredResults.length}`);
          
          // If filtering left us with too few results, add back some neutral ones
          if (filteredResults.length < 10) {
            console.log('Too few results after filtering, adding back neutral domains');
            filteredResults = serviceResults.filter(result => {
              const url = result.url.toLowerCase();
              const hasPreferredDomain = preferredDomains.some(domain => url.includes(domain));
              const hasOtherCountryDomain = otherCountryDomains.some(domain => url.includes(domain));
              
              // Keep preferred domains and neutral domains, but not other country domains
              return hasPreferredDomain || !hasOtherCountryDomain;
            });
          }
        }
        
        // Filter out existing place IDs (for pagination)
        if (existingPlaceIds.length > 0) {
          console.log(`Filtering out ${existingPlaceIds.length} existing place IDs`);
          filteredResults = filteredResults.filter(result => 
            !existingPlaceIds.includes(result.id)
          );
        }
        
        return filteredResults;
      };
      
      // Process the results
      const processedResults = processResults();
      console.log(`Returning ${processedResults.length} processed results`);
      
      // Return results with pagination token
      return new Response(
        JSON.stringify({
          results: processedResults,
          nextPageToken: nextPageToken,
          hasMore: hasMore
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
