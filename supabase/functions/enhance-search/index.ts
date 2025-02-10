
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, handleOptions } from '../_shared/cors.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    console.log('Received request:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
    });

    const { query, country, region } = await req.json();
    console.log('Enhancing search query:', { query, country, region });

    if (!query || !country) {
      throw new Error('Query and country are required');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Fixed: Using a valid model name
        messages: [
          {
            role: 'system',
            content: `You are a local business search specialist. Your task is to enhance search queries to find ONLY small-to-medium local business service providers within a 20-mile radius.`
          },
          {
            role: 'user',
            content: `Enhance this search query to find ONLY local businesses within 20 miles offering these services:
            Business Type: ${query}
            Country: ${country}
            ${region ? `Region: ${region}` : ''}`
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      }),
    });

    const data = await response.json();
    console.log('OpenAI response:', data);
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const enhancedQuery = data.choices[0].message.content
      .replace(/['"]/g, '')
      .trim();
    
    console.log('Enhanced query:', enhancedQuery);

    return new Response(
      JSON.stringify({
        enhancedQuery,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error enhancing search query:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        enhancedQuery: null
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});
