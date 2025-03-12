
import { PLACE_FIELDS } from './config.ts';
import { getMajorCities } from './utils.ts';
import { PlacesSearchOptions, SearchResponse } from './types.ts';

// Function to fetch multiple pages of results
export async function fetchMoreResults(
  requestBody: any, 
  apiKey: string, 
  desiredCount = 30
): Promise<SearchResponse> {
  let allResults = [];
  let nextPageToken = null;
  let pageCount = 0;
  const MAX_PAGES = Math.ceil(desiredCount / 20);
  
  do {
    if (nextPageToken) {
      requestBody.pageToken = nextPageToken;
    }
    
    const apiUrl = `https://places.googleapis.com/v1/places:searchText?key=${apiKey}`;
    
    console.log(`Making Places API request (page ${pageCount + 1}):`, JSON.stringify(requestBody));
    
    try {
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
      
      const placesResults = responseData.places || [];
      allResults = [...allResults, ...placesResults];
      
      nextPageToken = responseData.nextPageToken;
      pageCount++;
      
      if (allResults.length >= desiredCount || pageCount >= MAX_PAGES || !nextPageToken) {
        break;
      }
      
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
export async function fetchWithVariations(
  baseQuery: string,
  country: string,
  region: string,
  requestBody: any,
  apiKey: string,
  desiredCount = 60
): Promise<SearchResponse> {
  console.log(`Fetching results with variations for: ${baseQuery}, ${region}, ${country}`);
  
  const variations = [baseQuery];
  
  if (region) {
    variations.push(`${baseQuery} ${region}`);
    const cities = getMajorCities(country, region);
    
    if (cities && cities.length > 0) {
      cities.forEach(city => {
        variations.push(`${baseQuery} ${city}`);
      });
    } else {
      variations.push(`${baseQuery} services ${region}`);
      variations.push(`${baseQuery} business ${region}`);
    }
  }
  
  if (baseQuery.toLowerCase().includes('dentist')) {
    variations.push(`${baseQuery} clinic ${region}`);
    variations.push(`dental clinic ${region}`);
    variations.push(`dental practice ${region}`);
  } else if (baseQuery.toLowerCase().includes('plumber')) {
    variations.push(`plumbing services ${region}`);
    variations.push(`emergency plumber ${region}`);
    variations.push(`${baseQuery} contractor ${region}`);
  } else {
    // General variations for any business type
    variations.push(`${baseQuery} company ${region}`);
    variations.push(`${baseQuery} service provider ${region}`);
    variations.push(`top ${baseQuery} ${region}`);
    variations.push(`best ${baseQuery} ${region}`);
  }
  
  console.log(`Created ${variations.length} search variations:`, variations);
  
  const allResultsMap = new Map();
  let nextPageToken = null;
  let hasMore = false;
  
  for (const variation of variations) {
    if (allResultsMap.size >= desiredCount) break;
    
    const variationRequestBody = { ...requestBody, textQuery: variation };
    
    console.log(`Fetching results for variation: "${variation}"`);
    const { results, nextPageToken: token, hasMore: more } = 
      await fetchMoreResults(variationRequestBody, apiKey, Math.min(30, desiredCount - allResultsMap.size));
    
    if (token) nextPageToken = token;
    if (more) hasMore = true;
    
    for (const result of results) {
      if (!allResultsMap.has(result.id)) {
        allResultsMap.set(result.id, result);
      }
    }
    
    console.log(`Found ${results.length} results for "${variation}", total unique results: ${allResultsMap.size}`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return {
    results: Array.from(allResultsMap.values()),
    nextPageToken,
    hasMore
  };
}

function buildFieldMask(fields = Object.values(PLACE_FIELDS)): string {
  return fields.join(',');
}
