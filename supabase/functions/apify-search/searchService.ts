import { APIFY_ACTORS, SEARCH_CONFIG, COUNTRY_MAPPINGS } from './config.ts';
import { ApifySearchOptions, ApifySearchResponse, ApifyResult, ApifyBusinessData } from './types.ts';
import { processApifyResults } from './resultProcessor.ts';

export async function executeApifySearch(options: ApifySearchOptions): Promise<ApifySearchResponse> {
  const { query, country, region, limit = 20, pageToken, apiKey } = options;
  
  console.log('Starting Apify search with options:', { query, country, region, limit });
  
  // Build search query with location context
  let searchQuery = query;
  if (region) {
    searchQuery += ` in ${region}`;
  }
  if (country && COUNTRY_MAPPINGS[country]) {
    searchQuery += ` ${COUNTRY_MAPPINGS[country]}`;
  } else if (country) {
    searchQuery += ` ${country}`;
  }
  
  console.log('Constructed search query:', searchQuery);
  
  try {
    // Use a working Google search scraper instead
    const runResponse = await fetch(`https://api.apify.com/v2/acts/dtrungtin~google-maps-scraper/runs?token=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchQuery: searchQuery,
        maxResults: Math.min(limit, SEARCH_CONFIG.MAX_RESULTS_PER_REQUEST),
        language: 'en',
        includeContacts: true,
        includeWebsites: true,
      }),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Apify run creation failed:', errorText);
      throw new Error(`Failed to start Apify search: ${runResponse.status} - ${errorText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    
    console.log('Created Apify run:', runId);

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes max (10 second intervals)
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/dtrungtin~google-maps-scraper/runs/${runId}?token=${apiKey}`);
      const statusData = await statusResponse.json();
      
      console.log(`Run status (attempt ${attempts + 1}):`, statusData.data.status);
      
      if (statusData.data.status === 'SUCCEEDED') {
        // Get the results
        const resultsResponse = await fetch(`https://api.apify.com/v2/acts/dtrungtin~google-maps-scraper/runs/${runId}/dataset/items?token=${apiKey}`);
        
        if (!resultsResponse.ok) {
          throw new Error(`Failed to fetch results: ${resultsResponse.status}`);
        }
        
        const results = await resultsResponse.json();
        console.log(`Retrieved ${results.length} raw results from Apify`);
        
        // Process and format results
        const processedResults = processApifyResults(results);
        
        return {
          results: processedResults,
          nextPageToken: undefined, // Apify doesn't typically use pagination tokens like this
          hasMore: false // For now, we'll handle pagination differently
        };
      } else if (statusData.data.status === 'FAILED') {
        const errorDetail = statusData.data.errors?.[0]?.message || 'Unknown error';
        throw new Error(`Apify search run failed: ${errorDetail}`);
      }
      
      attempts++;
    }
    
    throw new Error('Apify search run timed out');
  } catch (error) {
    console.error('Error in executeApifySearch:', error);
    throw error;
  }
}

// Helper function to build search variations for better results
export function buildSearchVariations(baseQuery: string, region?: string, country?: string): string[] {
  const variations = [baseQuery];
  
  if (region) {
    variations.push(`${baseQuery} ${region}`);
    variations.push(`${baseQuery} near ${region}`);
    variations.push(`best ${baseQuery} ${region}`);
    variations.push(`top ${baseQuery} ${region}`);
  }
  
  // Add business-specific variations
  if (baseQuery.toLowerCase().includes('restaurant')) {
    variations.push(`${baseQuery} dining ${region || ''}`);
    variations.push(`${baseQuery} food ${region || ''}`);
  } else if (baseQuery.toLowerCase().includes('doctor') || baseQuery.toLowerCase().includes('dentist')) {
    variations.push(`${baseQuery} clinic ${region || ''}`);
    variations.push(`${baseQuery} practice ${region || ''}`);
  } else if (baseQuery.toLowerCase().includes('lawyer')) {
    variations.push(`${baseQuery} attorney ${region || ''}`);
    variations.push(`${baseQuery} law firm ${region || ''}`);
  } else {
    // General business variations
    variations.push(`${baseQuery} service ${region || ''}`);
    variations.push(`${baseQuery} company ${region || ''}`);
  }
  
  return variations.slice(0, 5); // Limit to prevent too many requests
}