import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, country } = await req.json();
    console.log('Received request:', { query, country });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a search query enhancement assistant. Given a basic query and country, generate a detailed search query that will help find relevant business websites. Focus on including industry-specific terms and location-based modifiers.'
          },
          {
            role: 'user',
            content: `Generate a detailed search query for finding "${query}" in ${country}. Include relevant business terms and location modifiers.`
          }
        ],
      }),
    });

    const data = await response.json();
    console.log('OpenAI response:', data);

    const enhancedQuery = data.choices[0].message.content;
    console.log('Enhanced query:', enhancedQuery);

    return new Response(JSON.stringify({ enhancedQuery }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in enhance-search function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});