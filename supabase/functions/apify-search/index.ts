import { corsHeaders } from '../_shared/cors.ts';
import { 
  validateSearchQuery, 
  validateNumber, 
  sanitizeString,
  ValidationException, 
  createValidationErrorResponse,
  checkRateLimit 
} from '../_shared/validation.ts';
import { ApifySearchOptions, ApifySearchResponse } from './types.ts';
import { executeApifySearch } from './searchService.ts';

const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY');
console.log('APIFY_API_KEY available:', !!APIFY_API_KEY);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }
  
  try {
    // Rate limiting check
    const userAgent = req.headers.get('user-agent');
    const clientIP = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for');
    
    if (!checkRateLimit(userAgent, clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Request blocked', status: 'rate_limited' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    let options: ApifySearchOptions;
    try {
      options = await req.json();
      console.log('Received Apify search request with options:', JSON.stringify(options, null, 2));
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
          details: jsonError.message,
          status: 'invalid_json'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    
    // Extract and validate inputs
    const { query, country, region, pageToken, limit = 20, apiKey: clientApiKey } = options;
    
    // Validate required fields
    let validatedQuery: string;
    let validatedCountry: string | undefined;
    let validatedRegion: string | undefined;
    let validatedLimit: number;
    
    try {
      validatedQuery = validateSearchQuery(query);
      validatedLimit = validateNumber(limit, 'limit', 1, 100);
      
      if (country) {
        validatedCountry = sanitizeString(country);
      }
      
      if (region) {
        validatedRegion = sanitizeString(region);
      }
    } catch (validationError) {
      if (validationError instanceof ValidationException) {
        return createValidationErrorResponse(validationError);
      }
      throw validationError;
    }
    
    // Use server API key if client key is placeholder or missing
    const apiKey = (clientApiKey && clientApiKey !== 'backend-configured') ? clientApiKey : APIFY_API_KEY;
    console.log('Using API key:', { 
      hasClientKey: !!clientApiKey, 
      hasServerKey: !!APIFY_API_KEY, 
      clientKeyIsPlaceholder: clientApiKey === 'backend-configured',
      finalKeyLength: apiKey?.length || 0 
    });
    
    // Check API key
    if (!apiKey) {
      console.error('No Apify API key available');
      return new Response(
        JSON.stringify({
          error: 'API key configuration error',
          details: 'Apify API key is not configured',
          status: 'config_error'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
    
    try {
      const searchResult: ApifySearchResponse = await executeApifySearch({
        query: validatedQuery,
        country: validatedCountry,
        region: validatedRegion,
        limit: validatedLimit,
        pageToken,
        apiKey
      });
      
      console.log(`Retrieved ${searchResult.results.length} results from Apify`);
      
      // Return results with pagination token
      return new Response(
        JSON.stringify(searchResult),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } catch (apiError) {
      console.error('Error from Apify API:', apiError);
      return new Response(
        JSON.stringify({
          error: 'Apify API error',
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