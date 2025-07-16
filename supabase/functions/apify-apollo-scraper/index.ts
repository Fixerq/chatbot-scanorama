import { corsHeaders } from '../_shared/cors.ts';

const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY');

interface ApifyScraperOptions {
  companyName: string;
  domain?: string;
  location?: string;
}

interface ApolloContact {
  firstName?: string;
  lastName?: string;
  email?: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  phone?: string;
}

interface ApifyResponse {
  contacts: ApolloContact[];
  companyInfo?: {
    name?: string;
    domain?: string;
    industry?: string;
    size?: string;
    phone?: string;
    address?: string;
  };
}

async function runApolloScraper(options: ApifyScraperOptions): Promise<ApifyResponse> {
  if (!APIFY_API_KEY) {
    throw new Error('APIFY_API_KEY not configured');
  }

  console.log('Starting Apollo scraper with options:', options);

  // Create a new Apify actor run
  const runResponse = await fetch(`https://api.apify.com/v2/acts/lukaskrivka~apollo-scraper/runs?token=${APIFY_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      searchCompanyName: options.companyName,
      searchCompanyDomain: options.domain,
      searchCompanyLocation: options.location,
      maxResults: 10,
      includeContactInfo: true,
      includeEmails: true,
    }),
  });

  if (!runResponse.ok) {
    const errorText = await runResponse.text();
    console.error('Apify run creation failed:', errorText);
    throw new Error(`Failed to start Apify scraper: ${runResponse.status} - ${errorText}`);
  }

  const runData = await runResponse.json();
  const runId = runData.data.id;
  
  console.log('Created Apify run:', runId);

  // Poll for completion (with timeout)
  let attempts = 0;
  const maxAttempts = 30; // 5 minutes max
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    
    const statusResponse = await fetch(`https://api.apify.com/v2/acts/lukaskrivka~apollo-scraper/runs/${runId}?token=${APIFY_API_KEY}`);
    const statusData = await statusResponse.json();
    
    console.log(`Run status (attempt ${attempts + 1}):`, statusData.data.status);
    
    if (statusData.data.status === 'SUCCEEDED') {
      // Get the results
      const resultsResponse = await fetch(`https://api.apify.com/v2/acts/lukaskrivka~apollo-scraper/runs/${runId}/dataset/items?token=${APIFY_API_KEY}`);
      const results = await resultsResponse.json();
      
      console.log('Apollo scraper results:', results);
      
      // Process and structure the results
      const contacts: ApolloContact[] = results.map((item: any) => ({
        firstName: item.first_name,
        lastName: item.last_name,
        email: item.email,
        title: item.title,
        company: item.company_name,
        linkedinUrl: item.linkedin_url,
        phone: item.phone,
      })).filter((contact: ApolloContact) => contact.email); // Only include contacts with emails
      
      // Extract company info if available
      const companyInfo = results.length > 0 ? {
        name: results[0].company_name,
        domain: results[0].company_domain,
        industry: results[0].company_industry,
        size: results[0].company_size,
        phone: results[0].company_phone,
        address: results[0].company_address,
      } : undefined;
      
      return {
        contacts,
        companyInfo,
      };
    } else if (statusData.data.status === 'FAILED') {
      throw new Error('Apollo scraper run failed');
    }
    
    attempts++;
  }
  
  throw new Error('Apollo scraper run timed out');
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const { companyName, domain, location } = await req.json();
    
    if (!companyName) {
      return new Response(
        JSON.stringify({ error: 'Company name is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing Apollo scraper request for:', companyName);
    
    const results = await runApolloScraper({
      companyName,
      domain,
      location,
    });

    return new Response(
      JSON.stringify(results),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in Apollo scraper function:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Apollo scraper failed',
        details: error.message,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});