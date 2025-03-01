
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { CHAT_PATTERNS } from './patterns.ts';
import { fetchWithRetry } from './utils/httpUtils.ts';
import { normalizeUrl } from './utils/urlUtils.ts';
import { 
  detectDynamicLoading, 
  detectChatElements, 
  detectMetaTags, 
  detectWebSockets 
} from './utils/patternDetection.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple cache to avoid analyzing the same URL repeatedly in a short time
const analysisCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

async function analyzeSingleWebsite(url: string) {
  console.log(`Analyzing website: ${url}`);
  
  try {
    const normalizedUrl = normalizeUrl(url);
    
    // Check cache first
    const cachedResult = analysisCache.get(normalizedUrl);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
      console.log(`Using cached result for ${normalizedUrl}`);
      return cachedResult.result;
    }
    
    // Fetch the website content
    const response = await fetchWithRetry(normalizedUrl);
    const html = await response.text();
    
    // Detect chatbot solutions
    const detectedChatSolutions: string[] = [];
    
    // Check for specific chat solutions using patterns from patterns.ts
    for (const [solution, patterns] of Object.entries(CHAT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(html)) {
          if (!detectedChatSolutions.includes(solution)) {
            console.log(`Detected ${solution} using pattern`);
            detectedChatSolutions.push(solution);
            break;
          }
        }
      }
    }
    
    // Check for dynamic loading patterns if no solution detected yet
    if (detectedChatSolutions.length === 0 && detectDynamicLoading(html)) {
      console.log('Detected dynamically loaded chat widget');
      detectedChatSolutions.push('Custom Chat');
    }
    
    // Check for common chat-related elements
    if (detectedChatSolutions.length === 0 && detectChatElements(html)) {
      console.log('Detected common chat elements');
      detectedChatSolutions.push('Custom Chat');
    }
    
    // Check for chat-related meta tags
    if (detectedChatSolutions.length === 0 && detectMetaTags(html)) {
      console.log('Detected chat-related meta tags');
      detectedChatSolutions.push('Custom Chat');
    }
    
    // Check for WebSocket connections
    if (detectedChatSolutions.length === 0 && detectWebSockets(html)) {
      console.log('Detected WebSocket-based chat');
      detectedChatSolutions.push('Custom Chat');
    }
    
    // Prepare the result
    const result = {
      url: normalizedUrl,
      status: 'completed',
      hasChatbot: detectedChatSolutions.length > 0,
      solutions: detectedChatSolutions
    };
    
    // Store in cache
    analysisCache.set(normalizedUrl, {
      timestamp: Date.now(),
      result
    });
    
    return result;
  } catch (error) {
    console.error(`Error analyzing ${url}:`, error);
    return {
      url,
      status: 'error',
      hasChatbot: false,
      solutions: [],
      error: error.message
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls, debug = false } = await req.json();
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: No URLs provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Starting analysis for ${urls.length} URLs, isBatch: ${urls.length > 1}, retry: false`);
    
    // For single URL analysis
    if (urls.length === 1) {
      const result = await analyzeSingleWebsite(urls[0]);
      
      return new Response(
        JSON.stringify([result]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For batch analysis
    const results = await Promise.all(
      urls.map(url => analyzeSingleWebsite(url))
    );
    
    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: `Analysis failed: ${error.message}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
