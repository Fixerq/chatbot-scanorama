
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { validateRequest } from './utils/requestValidator.ts';
import { analyzeChatbot } from './analyzer.ts';
import { ChatDetectionResult, RequestData } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Content-Type': 'application/json'
};

const CHATBOT_PROVIDERS = {
  gohighlevel: {
    name: 'Go High Level',
    signatures: [
      'ghl-widget',
      'gohighlevel.com',
      'highlevel.com',
      'conversation-ai'
    ]
  },
  drift: {
    name: 'Drift',
    signatures: [
      'drift-widget',
      'drift-frame',
      'drift.com'
    ]
  },
  intercom: {
    name: 'Intercom',
    signatures: [
      'intercom-container',
      'intercom-messenger',
      'intercom.com'
    ]
  },
  hubspot: {
    name: 'HubSpot',
    signatures: [
      'hubspot-messages-iframe',
      'HubSpot',
      'hs-script'
    ]
  },
  livechat: {
    name: 'LiveChat',
    signatures: [
      'livechatinc',
      'livechat-widget',
      'livechat.com'
    ]
  },
  tawk: {
    name: 'Tawk.to',
    signatures: [
      'tawk-to',
      'tawkto',
      'embed.tawk.to'
    ]
  },
  zendesk: {
    name: 'Zendesk',
    signatures: [
      'zopim',
      'zdassets',
      'zd-messenger',
      'zendesk.com'
    ]
  }
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

async function analyzeWebsite(url: string): Promise<ChatDetectionResult> {
  try {
    console.log('Checking cache for URL:', url);
    
    // Check cache first
    const { data: cachedResult, error: cacheError } = await supabase
      .from('cached_analyses')
      .select('*')
      .eq('url', url)
      .single();

    if (cacheError) {
      console.error('Cache lookup error:', cacheError);
    }

    // If recent cache exists (less than 24 hours old)
    if (cachedResult && 
        new Date(cachedResult.last_analyzed).getTime() > Date.now() - 24 * 60 * 60 * 1000) {
      console.log('Found recent cache for URL:', url);
      return {
        status: 'success',
        chatSolutions: cachedResult.chatbot_providers || [],
        lastChecked: cachedResult.last_analyzed
      };
    }

    console.log('No recent cache found, analyzing website:', url);

    // Fetch and analyze website
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChatbotAnalyzer/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Check for chatbot providers
    const detectedProviders = [];
    const details = {};

    for (const [key, provider] of Object.entries(CHATBOT_PROVIDERS)) {
      const detected = provider.signatures.some(sig => 
        html.toLowerCase().includes(sig.toLowerCase())
      );

      if (detected) {
        detectedProviders.push(provider.name);
        details[key] = {
          detected: true,
          name: provider.name,
          signatures_found: provider.signatures.filter(sig => 
            html.toLowerCase().includes(sig.toLowerCase())
          )
        };
      }
    }

    // Update cache
    const { error: upsertError } = await supabase
      .from('cached_analyses')
      .upsert({
        url,
        has_chatbot: detectedProviders.length > 0,
        chatbot_providers: detectedProviders,
        analysis_details: details,
        last_analyzed: new Date().toISOString(),
        is_error: false
      });

    if (upsertError) {
      console.error('Cache update error:', upsertError);
    }

    return {
      status: 'success',
      chatSolutions: detectedProviders,
      lastChecked: new Date().toISOString()
    };

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Record error in cache
    const { error: upsertError } = await supabase
      .from('cached_analyses')
      .upsert({
        url,
        has_chatbot: false,
        chatbot_providers: [],
        analysis_details: { error: error.message },
        last_analyzed: new Date().toISOString(),
        is_error: true,
        error_message: error.message
      });

    if (upsertError) {
      console.error('Error cache update failed:', upsertError);
    }

    return {
      status: 'error',
      chatSolutions: [],
      lastChecked: new Date().toISOString()
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse and validate request
    const requestData: RequestData = validateRequest(await req.text());
    
    // Analyze website
    const result = await analyzeWebsite(requestData.url);
    
    return new Response(
      JSON.stringify(result),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({
        status: 'error',
        error: error.message,
        chatSolutions: [],
        lastChecked: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});
