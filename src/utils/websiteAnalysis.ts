import { supabase } from '@/integrations/supabase/client';

interface AnalysisResult {
  status: string;
  details: {
    chatSolutions?: string[];
    errorDetails?: string;
    lastChecked?: string;
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

export const analyzeWebsite = async (url: string): Promise<AnalysisResult> => {
  try {
    console.log(`Starting analysis for ${url}`);
    
    // First check cache
    const { data: cachedResult } = await supabase
      .from('analyzed_urls')
      .select('*')
      .eq('url', url)
      .single();

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
            lastChecked: parsedDetails?.lastChecked
          },
          technologies: cachedResult.technologies || []
        };
      }
    }

    // Create a timeout promise
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT);

    try {
      // Fetch the webpage
      const response = await fetch(url.startsWith('http') ? url : `https://${url}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ChatbotDetector/1.0)'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const detectedChatSolutions: string[] = [];

      // Check for chat solutions using regex patterns
      for (const [solution, patterns] of Object.entries(CHAT_PATTERNS)) {
        if (patterns.some(pattern => pattern.test(html))) {
          detectedChatSolutions.push(solution);
        }
      }

      const result: AnalysisResult = {
        status: detectedChatSolutions.length > 0 ? 
          `Chatbot detected (${detectedChatSolutions.join(', ')})` : 
          'No chatbot detected',
        details: {
          chatSolutions: detectedChatSolutions,
          lastChecked: new Date().toISOString()
        },
        technologies: []
      };

      // Cache the result
      await supabase
        .from('analyzed_urls')
        .upsert({
          url,
          status: result.status,
          details: result.details,
          technologies: result.technologies
        });

      return result;

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }

  } catch (error) {
    console.error('Error analyzing website:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = errorMessage.includes('abort') ? 'Analysis timed out' : 'Error analyzing website';
    
    const result: AnalysisResult = {
      status,
      details: { 
        errorDetails: errorMessage,
        lastChecked: new Date().toISOString()
      },
      technologies: []
    };

    return result;
  }
};