import { FirecrawlService } from './firecrawl';
import { handleFirecrawlError } from './errors/firecrawlErrors';

interface AnalysisResult {
  status: string;
  chatbotDetected: boolean;
  details: {
    hasLiveChat: boolean;
    hasChatWidget: boolean;
    hasMessenger: boolean;
    hasIntercom: boolean;
    hasZendesk: boolean;
    hasCustomChat: boolean;
  };
  technologies: string[];
  errorDetails?: string;
}

const CHATBOT_PATTERNS = {
  livechat: [
    'livechat',
    'live-chat',
    'live chat',
    'chat-widget',
    'chat widget'
  ],
  messenger: [
    'messenger-widget',
    'fb-messenger',
    'facebook-messenger'
  ],
  intercom: [
    'intercom-container',
    'intercom-messenger',
    'intercom-launcher'
  ],
  zendesk: [
    'zopim',
    'zendesk-chat',
    'zopim-chat'
  ],
  customChat: [
    'chat-bot',
    'chatbot',
    'ai-chat',
    'virtual-assistant',
    'chat-assistant'
  ]
};

const TECHNOLOGY_PATTERNS = {
  analytics: ['google-analytics', 'gtag', 'hotjar', 'mixpanel'],
  marketing: ['hubspot', 'marketo', 'pardot', 'salesforce'],
  advertising: ['google-ads', 'facebook-pixel', 'linkedin-pixel'],
  optimization: ['optimize', 'optimizely', 'vwo', 'ab-tasty'],
  security: ['cloudflare', 'sucuri', 'recaptcha']
};

export const analyzeWebsite = async (url: string): Promise<AnalysisResult> => {
  console.log('Starting detailed analysis for:', url);
  
  try {
    const response = await FirecrawlService.crawlWebsite(url);
    
    if (!response.success) {
      console.error('Firecrawl error:', response.error);
      const errorMessage = handleFirecrawlError(response.error);
      return {
        status: errorMessage,
        chatbotDetected: false,
        details: {
          hasLiveChat: false,
          hasChatWidget: false,
          hasMessenger: false,
          hasIntercom: false,
          hasZendesk: false,
          hasCustomChat: false
        },
        technologies: [],
        errorDetails: response.error
      };
    }

    const htmlContent = response.data?.data?.[0]?.html || '';
    
    // Analyze for different types of chat solutions
    const details = {
      hasLiveChat: CHATBOT_PATTERNS.livechat.some(pattern => 
        htmlContent.toLowerCase().includes(pattern)),
      hasChatWidget: htmlContent.includes('chat-widget') || 
        htmlContent.includes('chatWidget'),
      hasMessenger: CHATBOT_PATTERNS.messenger.some(pattern => 
        htmlContent.toLowerCase().includes(pattern)),
      hasIntercom: CHATBOT_PATTERNS.intercom.some(pattern => 
        htmlContent.toLowerCase().includes(pattern)),
      hasZendesk: CHATBOT_PATTERNS.zendesk.some(pattern => 
        htmlContent.toLowerCase().includes(pattern)),
      hasCustomChat: CHATBOT_PATTERNS.customChat.some(pattern => 
        htmlContent.toLowerCase().includes(pattern))
    };

    // Detect technologies used
    const technologies = Object.entries(TECHNOLOGY_PATTERNS).flatMap(([category, patterns]) => {
      return patterns.filter(pattern => 
        htmlContent.toLowerCase().includes(pattern)
      ).map(pattern => `${category}:${pattern}`);
    });

    const chatbotDetected = Object.values(details).some(value => value);
    
    console.log('Analysis complete:', {
      url,
      chatbotDetected,
      details,
      technologies
    });

    return {
      status: chatbotDetected ? 'Chatbot detected' : 'No chatbot detected',
      chatbotDetected,
      details,
      technologies
    };
  } catch (error) {
    console.error('Error during analysis:', error);
    const errorMessage = handleFirecrawlError(error);
    return {
      status: errorMessage,
      chatbotDetected: false,
      details: {
        hasLiveChat: false,
        hasChatWidget: false,
        hasMessenger: false,
        hasIntercom: false,
        hasZendesk: false,
        hasCustomChat: false
      },
      technologies: [],
      errorDetails: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};