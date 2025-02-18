
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { urls, isBatch, retry } = await req.json();

    // Validate request body
    if (!urls) {
      console.error('Missing urls in request body');
      return new Response(
        JSON.stringify({ error: 'urls is required in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle batch request
    if (isBatch) {
      if (!Array.isArray(urls)) {
        console.error('urls must be an array for batch processing');
        return new Response(
          JSON.stringify({ error: 'urls must be an array for batch processing' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Processing batch of ${urls.length} URLs`);

      // Process each URL (implement your analysis logic here)
      const results = await Promise.all(
        urls.map(async (url) => {
          // Add your URL analysis logic here
          return {
            url,
            status: 'completed',
            has_chatbot: Math.random() > 0.5, // Placeholder analysis result
            chatbot_solutions: ['Solution A', 'Solution B']
          };
        })
      );

      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle single URL request
    const url = urls[0];
    if (!url) {
      console.error('No valid URL provided');
      return new Response(
        JSON.stringify({ error: 'No valid URL provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process single URL (implement your analysis logic here)
    const result = {
      url,
      status: 'completed',
      has_chatbot: Math.random() > 0.5,
      chatbot_solutions: ['Solution A', 'Solution B']
    };

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
