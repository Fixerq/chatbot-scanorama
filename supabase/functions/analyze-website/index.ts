
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateRequest } from './utils/requestValidator.ts';
import { analyzeWebsite } from './services/websiteAnalyzer.ts';
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
    
    // Analyze website
    const result = await analyzeWebsite(requestData.url);
    console.log('Analysis complete:', result);
    
    return new Response(
      JSON.stringify(result),
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
