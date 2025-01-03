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

const PLATFORM_PATTERNS = {
  'WordPress': [
    /wp-content/i,
    /wp-includes/i,
    /wordpress/i,
    /wp-json/i,
    /wp-admin/i
  ],
  'Shopify': [
    /cdn\.shopify\.com/i,
    /shopify\.com/i,
    /myshopify\.com/i
  ],
  'Wix': [
    /wix\.com/i,
    /wixsite\.com/i,
    /_wix_/i
  ],
  'Squarespace': [
    /squarespace\.com/i,
    /static1\.squarespace\.com/i,
    /sqsp\.com/i
  ],
  'Webflow': [
    /webflow\.com/i,
    /webflow\.io/i,
    /assets-global\.website-files\.com/i
  ],
  'Drupal': [
    /drupal/i,
    /sites\/all/i,
    /modules\/system/i
  ],
  'Joomla': [
    /joomla/i,
    /com_content/i,
    /mod_/i
  ],
  'Ghost': [
    /ghost\.io/i,
    /ghost-theme/i
  ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const { url } = await req.json();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ChatbotDetector/1.0)'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const detectedChatSolutions = [];
      let detectedPlatform = 'Unknown';

      // Check for chat solutions
      for (const [solution, patterns] of Object.entries(CHAT_PATTERNS)) {
        if (patterns.some(pattern => pattern.test(html))) {
          detectedChatSolutions.push(solution);
        }
      }

      // Check for platform with enhanced patterns
      for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
        if (patterns.some(pattern => pattern.test(html))) {
          detectedPlatform = platform;
          break;
        }
      }

      // Additional platform detection from meta tags and generator
      const metaGeneratorMatch = html.match(/<meta\s+name="generator"\s+content="([^"]+)"/i);
      if (metaGeneratorMatch) {
        const generator = metaGeneratorMatch[1].toLowerCase();
        if (generator.includes('wordpress')) detectedPlatform = 'WordPress';
        else if (generator.includes('shopify')) detectedPlatform = 'Shopify';
        else if (generator.includes('wix')) detectedPlatform = 'Wix';
        else if (generator.includes('squarespace')) detectedPlatform = 'Squarespace';
        else if (generator.includes('webflow')) detectedPlatform = 'Webflow';
        else if (generator.includes('drupal')) detectedPlatform = 'Drupal';
        else if (generator.includes('joomla')) detectedPlatform = 'Joomla';
        else if (generator.includes('ghost')) detectedPlatform = 'Ghost';
      }

      return new Response(JSON.stringify({
        status: detectedChatSolutions.length > 0 ? 
          `Chatbot detected (${detectedChatSolutions.join(', ')})` : 
          'No chatbot detected',
        chatSolutions: detectedChatSolutions,
        platform: detectedPlatform,
        technologies: [],
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
    return new Response(JSON.stringify({
      status: 'Error analyzing website',
      error: error instanceof Error ? error.message : 'Unknown error',
      platform: 'Unknown',
      lastChecked: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  }
});