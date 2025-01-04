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
    const { query, country, region } = await req.json();
    console.log('Enhancing search query:', { query, country, region });

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
            content: `You are a search query enhancement assistant focused on finding local business services.
            - Return a simple search phrase without quotes or special characters
            - Keep it under 4 words
            - Focus on the core business service type
            - Understand context (e.g. "windows support" refers to computer services, not home windows)
            - Always think in terms of businesses offering services
            - Do not add location terms as they are handled separately
            
            Context rules:
            - "windows" in context of "support", "IT", "computer" refers to Microsoft Windows
            - "windows" alone or with "home", "house", "glass" refers to physical windows
            - "support" usually refers to IT/technical support unless clearly about physical items`
          },
          {
            role: 'user',
            content: `Enhance this search query to find local businesses offering these services:
            Business Type: ${query}
            Country: ${country}
            ${region ? `Region: ${region}` : ''}
            
            Example input: "plumbers"
            Example output: plumbing repair services
            
            Example input: "windows support specialist"
            Example output: computer tech support
            
            Example input: "window installation"
            Example output: home windows services`
          }
        ],
        temperature: 0.3,
        max_tokens: 30
      }),
    });

    const data = await response.json();
    console.log('OpenAI response:', data);
    
    const enhancedQuery = data.choices[0].message.content.trim().replace(/["']/g, '');
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