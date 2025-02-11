
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Search Places Edge Function Initialized");

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  console.log('Incoming request from origin:', origin);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        ...corsHeaders,
        'Access-Control-Allow-Origin': origin 
      } 
    });
  }

  try {
    const { type } = await req.json();
    console.log('Request type:', type);

    if (type === 'get_api_key') {
      const apiKey = Deno.env.get('Firecrawl');
      console.log('API key fetch attempt');
      
      if (!apiKey) {
        console.error('Firecrawl API key not configured');
        return new Response(
          JSON.stringify({ 
            error: 'API key not configured',
            details: 'Firecrawl API key is missing from environment variables'
          }),
          { 
            status: 500,
            headers: { 
              ...corsHeaders,
              'Access-Control-Allow-Origin': origin 
            } 
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          data: { 
            apiKey: apiKey 
          }
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Access-Control-Allow-Origin': origin 
          } 
        }
      );
    }

    if (type === 'search') {
      // Return mock data for now to verify endpoint works
      console.log('Returning mock search results');
      return new Response(
        JSON.stringify({ 
          data: { 
            results: [
              {
                url: 'https://example.com',
                details: {
                  title: 'Test Business',
                  description: 'A test business listing',
                  lastChecked: new Date().toISOString()
                }
              }
            ],
            hasMore: false
          }
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin 
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Invalid request type',
        receivedType: type 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Access-Control-Allow-Origin': origin 
        } 
      }
    );

  } catch (error) {
    console.error('Error in search function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        origin: origin
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Access-Control-Allow-Origin': origin 
        } 
      }
    );
  }
});
