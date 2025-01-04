import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
            content: `You are a local business search specialist. Your task is to enhance search queries to find local business service providers.

Key requirements:
- Focus ONLY on finding local business service providers and companies
- EXCLUDE job postings, educational institutions, government websites
- EXCLUDE news articles, blogs, directories like LinkedIn
- ADD relevant business-specific terms like "company", "service provider", "local business"
- Keep queries under 4 words
- Do not add location terms as they are handled separately

Examples:
❌ Bad: "computer support jobs"
✅ Good: "computer repair company"

❌ Bad: "windows installation training"
✅ Good: "window installation service"

❌ Bad: "plumbing certification course"
✅ Good: "local plumbing company"`
          },
          {
            role: 'user',
            content: `Enhance this search query to find local businesses offering these services:
            Business Type: ${query}
            Country: ${country}
            ${region ? `Region: ${region}` : ''}`
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