import { supabase } from '@/integrations/supabase/client';
import { FirecrawlError, handleFirecrawlError } from './errors/firecrawlErrors';

interface AnalysisResult {
  status: string;
  details: {
    chatSolutions?: string[];
    errorDetails?: string;
    lastChecked?: string;
  };
  technologies: string[];
}

const CHAT_SOLUTIONS = {
  'Intercom': ['.intercom-frame', '#intercom-container'],
  'Drift': ['#drift-widget', '.drift-frame-controller'],
  'Zendesk': ['.zEWidget-launcher', '#launcher'],
  'Crisp': ['.crisp-client', '#crisp-chatbox'],
  'LiveChat': ['#livechat-compact-container', '#chat-widget-container'],
  'Tawk.to': ['#tawkchat-container', '#tawkchat-minified-wrapper'],
  'HubSpot': ['#hubspot-messages-iframe-container', '.HubSpotWebWidget'],
  'Facebook Messenger': ['.fb-customerchat', '.fb_dialog'],
  'WhatsApp': ['.wa-chat-box', '.whatsapp-chat'],
  'Custom Chat': [
    '[class*="chat"]',
    '[class*="messenger"]',
    '[id*="chat"]',
    '[id*="messenger"]'
  ]
};

const TECHNOLOGY_PATTERNS = {
  'React': ['react', 'react-dom'],
  'Vue.js': ['vue', '__vue__'],
  'Angular': ['ng-version', 'angular'],
  'WordPress': ['wp-content', 'wp-includes'],
  'Shopify': ['shopify', 'Shopify.theme'],
  'Wix': ['wix-site', '_wixCssManager'],
  'Webflow': ['webflow', '.w-webflow-badge'],
  'jQuery': ['jquery', 'jQuery'],
  'Bootstrap': ['bootstrap', '.navbar-toggle'],
  'Tailwind': ['tailwind', '[class*="tw-"]']
};

export const analyzeWebsite = async (url: string): Promise<AnalysisResult> => {
  try {
    console.log(`Starting analysis for ${url}`);
    
    // Check cache first
    const { data: cachedResult } = await supabase
      .from('analyzed_urls')
      .select('*')
      .eq('url', url)
      .single();

    if (cachedResult) {
      const cacheAge = new Date().getTime() - new Date(cachedResult.created_at).getTime();
      const cacheValidityPeriod = 24 * 60 * 60 * 1000; // 24 hours

      if (cacheAge < cacheValidityPeriod) {
        console.log('Using cached result for', url);
        return {
          status: cachedResult.status,
          details: cachedResult.details as AnalysisResult['details'],
          technologies: cachedResult.technologies || []
        };
      }
    }

    // Perform new analysis
    const response = await fetch(url);
    if (!response.ok) {
      throw new FirecrawlError('HTTP_ERROR', `HTTP error ${response.status}`);
    }

    const html = await response.text();
    
    // Detect chat solutions
    const detectedChatSolutions = [];
    for (const [solution, selectors] of Object.entries(CHAT_SOLUTIONS)) {
      if (selectors.some(selector => html.includes(selector))) {
        detectedChatSolutions.push(solution);
      }
    }

    // Detect technologies
    const detectedTechnologies = [];
    for (const [tech, patterns] of Object.entries(TECHNOLOGY_PATTERNS)) {
      if (patterns.some(pattern => html.toLowerCase().includes(pattern.toLowerCase()))) {
        detectedTechnologies.push(tech);
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
      technologies: detectedTechnologies
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
    console.error('Error analyzing website:', error);
    const errorResult = handleFirecrawlError(error);
    
    const result: AnalysisResult = {
      status: errorResult,
      details: { errorDetails: errorResult },
      technologies: []
    };

    // Cache the error result
    await supabase
      .from('analyzed_urls')
      .upsert({
        url,
        status: result.status,
        details: result.details,
        technologies: result.technologies
      });

    return result;
  }
};