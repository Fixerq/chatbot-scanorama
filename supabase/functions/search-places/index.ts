
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { BusinessSearchResult } from "./types.ts";

console.log("Search Places Edge Function Initialized (Debug Mode)");

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  console.log('Debug - Incoming request from origin:', origin);
  
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
    const { type, query, country, region } = await req.json();
    console.log('Debug - Request params:', { type, query, country, region });

    if (type === 'get_api_key') {
      console.log('Debug - API key request received');
      return new Response(
        JSON.stringify({ 
          data: { 
            apiKey: 'test-api-key' 
          }
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Access-Control-Allow-Origin': origin,
            'Content-Type': 'application/json'
          } 
        }
      );
    }

    if (type === 'search') {
      console.log('Debug - Search request received with params:', { query, country, region });
      
      const mockResult: BusinessSearchResult = {
        results: [
          {
            url: 'https://example-business.com',
            details: {
              title: 'Example Local Business',
              description: 'A mock business for testing',
              lastChecked: new Date().toISOString(),
              address: '123 Test Street, Test City, Test Region',
              phone: '(555) 123-4567',
              mapsUrl: 'https://maps.google.com/example',
              types: ['business', 'local_business'],
              rating: 4.5
            }
          },
          {
            url: 'https://another-business.com',
            details: {
              title: 'Another Test Business',
              description: 'Second mock business for testing',
              lastChecked: new Date().toISOString(),
              address: '456 Debug Avenue, Test City, Test Region',
              phone: '(555) 987-6543',
              mapsUrl: 'https://maps.google.com/another-example',
              types: ['business', 'store'],
              rating: 4.2
            }
          }
        ],
        hasMore: false
      };

      return new Response(
        JSON.stringify({ 
          data: mockResult
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

    console.log('Debug - Invalid request type received:', type);
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request type',
        receivedType: type 
      }),
      { 
        status: 200, // Return 200 to avoid CORS issues
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin 
        } 
      }
    );

  } catch (error) {
    console.error('Debug - Error in search function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        origin: origin
      }),
      { 
        status: 200, // Return 200 to avoid CORS issues
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin 
        } 
      }
    );
  }
});
