
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

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

    // Always return a success response with test data
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          results: [{
            name: 'Test Business',
            address: '123 Test St, Test City, TS 12345',
            place_id: 'test_123',
            location: { lat: 39.7456, lng: -75.5466 },
            business_status: 'OPERATIONAL'
          }],
          total: 1
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
