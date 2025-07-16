import { APIFY_ACTORS, SEARCH_CONFIG, COUNTRY_MAPPINGS } from './config.ts';
import { ApifySearchOptions, ApifySearchResponse, ApifyResult, ApifyBusinessData } from './types.ts';
import { processApifyResults } from './resultProcessor.ts';

export async function executeApifySearch(options: ApifySearchOptions): Promise<ApifySearchResponse> {
  const { query, country, region, limit = 20, pageToken, apiKey } = options;
  
  console.log('Starting Apollo scraper search with options:', { query, country, region, limit });
  
  // Build Apollo.io search URL based on query and location
  let searchUrl = `https://app.apollo.io/#/people?finderViewId=5b8050d050a3893c382e9360&personLocations[]=${country || 'United States'}`;
  
  // Add query parameters to the Apollo URL
  if (query) {
    // Apollo uses specific URL parameters for search
    searchUrl += `&personTitles[]=${encodeURIComponent(query)}`;
  }
  
  if (region) {
    searchUrl += `&personLocations[]=${encodeURIComponent(region)}`;
  }
  
  console.log('Constructed Apollo search URL:', searchUrl);
  
  try {
    // Use the Apollo scraper actor
    const runResponse = await fetch(`https://api.apify.com/v2/acts/code_crafter~apollo-io-scraper/runs?token=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchUrl: searchUrl,
        totalNumberOfRecordsRequired: Math.min(limit, 50000), // Apollo scraper can handle up to 50k
        fileName: `Search_${Date.now()}`,
        cleanOutput: true
      }),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Apollo scraper run creation failed:', errorText);
      throw new Error(`Failed to start Apollo scraper: ${runResponse.status} - ${errorText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    
    console.log('Created Apollo scraper run:', runId);

    // Poll for completion with appropriate timeout for Apollo scraper
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes max (10 second intervals)
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/code_crafter~apollo-io-scraper/runs/${runId}?token=${apiKey}`);
      
      if (!statusResponse.ok) {
        console.error('Failed to check run status:', statusResponse.status);
        attempts++;
        continue;
      }
      
      const statusData = await statusResponse.json();
      
      console.log(`Apollo scraper run status (attempt ${attempts + 1}):`, statusData.data.status);
      
      if (statusData.data.status === 'SUCCEEDED') {
        // Get the results from Apollo scraper
        const resultsResponse = await fetch(`https://api.apify.com/v2/acts/code_crafter~apollo-io-scraper/runs/${runId}/dataset/items?token=${apiKey}`);
        
        if (!resultsResponse.ok) {
          throw new Error(`Failed to fetch Apollo results: ${resultsResponse.status}`);
        }
        
        const results = await resultsResponse.json();
        console.log(`Retrieved ${results.length} leads from Apollo scraper`);
        
        // Process Apollo results to match our expected format
        const processedResults = processApolloResults(results);
        
        return {
          results: processedResults,
          nextPageToken: undefined,
          hasMore: false
        };
      } else if (statusData.data.status === 'FAILED') {
        const errorDetail = statusData.data.errors?.[0]?.message || 'Unknown error';
        throw new Error(`Apollo scraper run failed: ${errorDetail}`);
      } else if (statusData.data.status === 'ABORTED') {
        throw new Error('Apollo scraper run was aborted');
      }
      
      attempts++;
    }
    
    throw new Error('Apollo scraper run timed out after 10 minutes');
  } catch (error) {
    console.error('Error in executeApifySearch:', error);
    throw error;
  }
}

// Process Apollo results to match our expected format
function processApolloResults(apolloResults: any[]): any[] {
  return apolloResults.map((lead, index) => ({
    id: lead.id || `apollo-${index}`,
    name: lead.name || lead.fullName || 'Unknown',
    title: lead.title || lead.jobTitle || '',
    description: lead.headline || lead.bio || '',
    url: lead.linkedinUrl || lead.profileUrl || '',
    phone: lead.phone || '',
    email: lead.email || '',
    company: lead.company || lead.organizationName || '',
    location: lead.location || lead.city || '',
    website: lead.companyWebsite || '',
    industry: lead.industry || '',
    status: 'completed'
  }));
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