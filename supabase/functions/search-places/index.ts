
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleOptions } from '../_shared/cors.ts';

serve(async (req) => {
  // Always return 200 for OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Wrap everything in try/catch
  try {
    // Parse request body
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    // Log the request
    console.log('Request received:', {
      method: req.method,
      url: req.url,
      body
    });

    // Return test data with all required fields
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          results: [{
            title: 'Test Business',
            description: 'A test business description',
            url: 'https://example.com',
            details: {
              title: 'Test Business',
              description: 'A test business description',
              lastChecked: new Date().toISOString(),
              address: '123 Test St, Test City, TS 12345',
              phone: '555-0123',
              mapsUrl: 'https://maps.google.com/?q=123+Test+St',
              types: ['business', 'local_business'],
              rating: 4.5
            }
          }],
          hasMore: false
        },
        debug: {
          received: body,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 200,
        headers: corsHeaders
      }
    );

  } catch (error) {
    // Even errors return 200 status
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        debug: {
          stack: error.stack,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 200,
        headers: corsHeaders
      }
    );
  }
});
