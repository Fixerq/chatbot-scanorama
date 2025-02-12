
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateRequest } from './utils/requestValidator.ts';
import { analyzeWithFirecrawl } from './services/firecrawlService.ts';
import { CHATBOT_PROVIDERS } from './providers/chatbotProviders.ts';
import { RequestData } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse and validate request
    const requestData: RequestData = validateRequest(await req.text());
    console.log('Analyzing website:', requestData.url);
    
    // Use Firecrawl for analysis
    const firecrawlResult = await analyzeWithFirecrawl(requestData.url);
    console.log('Firecrawl analysis complete:', firecrawlResult);
    
    if (firecrawlResult.status === 'error') {
      throw new Error(firecrawlResult.error || 'Analysis failed');
    }

    // Search for chatbot providers in the Firecrawl content
    const detectedProviders = [];
    if (firecrawlResult.content) {
      for (const [key, provider] of Object.entries(CHATBOT_PROVIDERS)) {
        if (provider.signatures.some(sig => 
          firecrawlResult.content.toLowerCase().includes(sig.toLowerCase())
        )) {
          detectedProviders.push(provider.name);
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        status: 'success',
        has_chatbot: detectedProviders.length > 0,
        chatSolutions: detectedProviders,
        details: firecrawlResult.metadata,
        lastChecked: firecrawlResult.analyzed_at
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        status: 'error',
        has_chatbot: false,
        providers: [],
        details: { error: error.message },
        lastChecked: new Date().toISOString()
      }),
      { 
        status: 200, // Return 200 even for errors
        headers: corsHeaders
      }
    );
  }
});
