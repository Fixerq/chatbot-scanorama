import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHAT_PATTERNS = {
  'Intercom': [/intercom/i, /widget\.intercom\.io/i],
  'Drift': [/drift\.com/i, /js\.driftt\.com/i, /drift-frame/i],
  'Zendesk': [/zopim/i, /zendesk/i, /zdassets\.com/i],
  'Crisp': [/crisp\.chat/i, /client\.crisp\.chat/i],
  'LiveChat': [/livechat/i, /livechatinc\.com/i],
  'Tawk.to': [/tawk\.to/i, /embed\.tawk\.to/i],
  'HubSpot': [/hubspot/i, /js\.hs-scripts\.com/i],
  'Facebook Messenger': [/facebook\.com\/customer_chat/i, /connect\.facebook\.net.*\/sdk\/xfbml\.customerchat/i],
  'WhatsApp': [/wa\.me/i, /whatsapp/i, /api\.whatsapp\.com/i],
  'Custom Chat': [/chat-widget/i, /chat-container/i, /chat-box/i, /messenger-widget/i]
};

function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

function validateUrl(url: string): void {
  if (!url) {
    throw new Error('URL is required');
  }
  try {
    new URL(normalizeUrl(url));
  } catch {
    throw new Error('Invalid URL format');
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const { url } = await req.json();
    console.log('Starting analysis for URL:', url);
    
    try {
      validateUrl(url);
    } catch (error) {
      console.error('URL validation failed:', error);
      return new Response(JSON.stringify({
        status: 'Invalid URL',
        error: error instanceof Error ? error.message : 'URL validation failed',
        lastChecked: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const normalizedUrl = normalizeUrl(url);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      console.log('Fetching URL:', normalizedUrl);
      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ChatbotDetector/1.0)'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorMessage = `HTTP error! status: ${response.status}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      const html = await response.text();
      const detectedChatSolutions = [];

      // Check for chat solutions
      for (const [solution, patterns] of Object.entries(CHAT_PATTERNS)) {
        if (patterns.some(pattern => pattern.test(html))) {
          detectedChatSolutions.push(solution);
        }
      }

      console.log('Analysis complete:', {
        url: normalizedUrl,
        chatSolutions: detectedChatSolutions
      });

      return new Response(JSON.stringify({
        status: detectedChatSolutions.length > 0 ? 
          `Chatbot detected (${detectedChatSolutions.join(', ')})` : 
          'No chatbot detected',
        chatSolutions: detectedChatSolutions,
        lastChecked: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }

  } catch (error) {
    console.error('Error analyzing website:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let status = 'Error analyzing website';
    let httpStatus = 500;

    if (errorMessage.includes('abort') || errorMessage.includes('timeout')) {
      status = 'Analysis timed out';
      httpStatus = 408;
    } else if (errorMessage.includes('404')) {
      status = 'Website not found';
      httpStatus = 404;
    } else if (errorMessage.includes('403')) {
      status = 'Access denied';
      httpStatus = 403;
    } else if (errorMessage.includes('network')) {
      status = 'Network error';
      httpStatus = 503;
    }

    return new Response(JSON.stringify({
      status,
      error: errorMessage,
      lastChecked: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: httpStatus
    });
  }
});