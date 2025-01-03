import { supabase } from '@/integrations/supabase/client';

interface AnalysisResult {
  status: string;
  details: {
    chatSolutions?: string[];
    errorDetails?: string;
    lastChecked?: string;
    platform?: string;
  };
  technologies: string[];
}

interface CachedResult {
  url: string;
  status: string;
  details: {
    chatSolutions?: string[];
    errorDetails?: string;
    lastChecked?: string;
    platform?: string;
  };
  technologies: string[];
  created_at: string;
}

const ANALYSIS_TIMEOUT = 30000; // 30 seconds

const CHAT_PATTERNS = {
  'Intercom': [
    /intercom/i,
    /widget\.intercom\.io/i
  ],
  'Drift': [
    /drift\.com/i,
    /js\.driftt\.com/i,
    /drift-frame/i
  ],
  'Zendesk': [
    /zopim/i,
    /zendesk/i,
    /zdassets\.com/i
  ],
  'Crisp': [
    /crisp\.chat/i,
    /client\.crisp\.chat/i
  ],
  'LiveChat': [
    /livechat/i,
    /livechatinc\.com/i
  ],
  'Tawk.to': [
    /tawk\.to/i,
    /embed\.tawk\.to/i
  ],
  'HubSpot': [
    /hubspot/i,
    /js\.hs-scripts\.com/i
  ],
  'Facebook Messenger': [
    /facebook\.com\/customer_chat/i,
    /connect\.facebook\.net.*\/sdk\/xfbml\.customerchat/i
  ],
  'WhatsApp': [
    /wa\.me/i,
    /whatsapp/i,
    /api\.whatsapp\.com/i
  ],
  'Custom Chat': [
    /chat-widget/i,
    /chat-container/i,
    /chat-box/i,
    /messenger-widget/i
  ]
};

const PLATFORM_PATTERNS = {
  'WordPress': [
    /wp-content/i,
    /wp-includes/i,
    /wordpress/i
  ],
  'Shopify': [
    /cdn\.shopify\.com/i,
    /shopify\.com/i
  ],
  'Wix': [
    /wix\.com/i,
    /wixsite\.com/i
  ],
  'Squarespace': [
    /squarespace\.com/i,
    /static1\.squarespace\.com/i
  ],
  'Webflow': [
    /webflow\.com/i,
    /webflow\.io/i
  ],
  'Drupal': [
    /drupal/i,
    /sites\/all/i
  ],
  'Joomla': [
    /joomla/i,
    /com_content/i
  ],
  'Ghost': [
    /ghost\.io/i,
    /ghost-theme/i
  ],
  'Custom/Unknown': []
};

export const analyzeWebsite = async (url: string): Promise<AnalysisResult> => {
  try {
    console.log('Starting analysis for', url);
    
    // First check cache
    const { data: cachedResult, error: cacheError } = await supabase
      .from('analyzed_urls')
      .select('*')
      .eq('url', url)
      .maybeSingle();

    if (cacheError) {
      console.error('Cache lookup error:', cacheError);
    }

    if (cachedResult) {
      const cacheAge = Date.now() - new Date(cachedResult.created_at).getTime();
      const cacheValidityPeriod = 24 * 60 * 60 * 1000; // 24 hours
      
      if (cacheAge < cacheValidityPeriod) {
        console.log('Using cached result for', url);
        const parsedDetails = typeof cachedResult.details === 'string' 
          ? JSON.parse(cachedResult.details) 
          : cachedResult.details;

        return {
          status: cachedResult.status,
          details: {
            chatSolutions: parsedDetails?.chatSolutions || [],
            errorDetails: parsedDetails?.errorDetails,
            lastChecked: parsedDetails?.lastChecked,
            platform: parsedDetails?.platform
          },
          technologies: cachedResult.technologies || []
        };
      }
    }

    // Use Supabase Edge Function to analyze the website
    const { data: analysisData, error: analysisError } = await supabase
      .functions.invoke('analyze-website', {
        body: { url }
      });

    if (analysisError) {
      throw new Error(`Analysis failed: ${analysisError.message}`);
    }

    if (!analysisData) {
      throw new Error('No analysis data returned');
    }

    const result: AnalysisResult = {
      status: analysisData.status || 'Analysis completed',
      details: {
        chatSolutions: analysisData.chatSolutions || [],
        platform: analysisData.platform || 'Unknown',
        lastChecked: new Date().toISOString()
      },
      technologies: analysisData.technologies || []
    };

    // Cache the result
    const { error: insertError } = await supabase
      .from('analyzed_urls')
      .upsert({
        url,
        status: result.status,
        details: result.details,
        technologies: result.technologies
      });

    if (insertError) {
      console.error('Error caching result:', insertError);
    }

    return result;

  } catch (error) {
    console.error('Error analyzing website:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = errorMessage.includes('abort') ? 'Analysis timed out' : 'Error analyzing website';
    
    const result: AnalysisResult = {
      status,
      details: { 
        errorDetails: errorMessage,
        lastChecked: new Date().toISOString(),
        platform: 'Unknown'
      },
      technologies: []
    };

    return result;
  }
};