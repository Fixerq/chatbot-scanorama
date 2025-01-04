import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  query: string;
  country: string;
  region?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, country, region } = await req.json() as RequestBody;

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
            content: `You are a search query enhancement assistant. Your task is to enhance search queries for finding business websites. 
            Focus on adding relevant industry terms, common business indicators, and location-specific terms.
            Return ONLY the enhanced search query, nothing else.`
          },
          {
            role: 'user',
            content: `Enhance this search query for finding business websites:
            Business Type: ${query}
            Country: ${country}
            ${region ? `Region: ${region}` : ''}
            
            Example input: "plumbers"
            Example output: "professional plumbers plumbing services water leak repair drainage emergency local business"`
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      }),
    });

    const data = await response.json();
    const enhancedQuery = data.choices[0].message.content.trim();

    console.log('Original query:', query);
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
        originalQuery: req.query // Return original query as fallback
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