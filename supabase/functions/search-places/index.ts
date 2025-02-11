
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { searchBusinesses } from './businessSearch.ts';

serve(async (req) => {
  // Always return 200 for OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Wrap everything in try/catch
  try {
    // Parse request body
    const body = await req.json();
    
    // Log the request
    console.log('Request received:', {
      method: req.method,
      url: req.url,
      body
    });

    // Handle search action
    if (body.type === 'search') {
      console.log('Starting business search with params:', body);
      const searchResult = await searchBusinesses({
        query: body.query,
        country: body.country,
        region: body.region
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            results: searchResult.results.map(result => ({
              url: result.url,
              title: result.details.title,
              description: result.details.description,
              details: result.details
            })),
            hasMore: false
          }
        }),
        { 
          status: 200,
          headers: corsHeaders
        }
      );
    }

    // Invalid action
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid action type',
        debug: {
          receivedBody: body,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 200,
        headers: corsHeaders
      }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    
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
