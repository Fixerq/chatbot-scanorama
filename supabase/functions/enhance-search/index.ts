import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, handleOptions } from '../_shared/cors.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const ASSISTANT_INSTRUCTIONS = `You are a local business search specialist. Your task is to enhance search queries to find ONLY small-to-medium local business service providers within a 20-mile radius.

Key requirements for search results:
1. ONLY return local business service providers within 20 miles
2. NO government websites, educational institutions, or large corporations
3. NO job boards, career sites, or news articles
4. NO online directories (LinkedIn, Yellow Pages, etc)
5. NO military/veteran services or non-profits

Guidelines for query enhancement:
1. ALWAYS include terms that indicate local business:
   - "local business"
   - "nearby"
   - "near me"
   - "in my area"
2. Focus on service-oriented businesses
3. Keep queries concise (3-4 words maximum)
4. Emphasize local/small business nature

Examples:
❌ "IT support services" → ✅ "local computer repair business nearby"
❌ "plumbing services" → ✅ "local plumber near me"
❌ "window installation" → ✅ "local window contractor in my area"
❌ "tech support" → ✅ "nearby IT company"

Always think: Will this query find actual local service businesses within 20 miles?

IMPORTANT: Return ONLY the enhanced query string, without any quotes or additional text.`;

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
            content: ASSISTANT_INSTRUCTIONS
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
