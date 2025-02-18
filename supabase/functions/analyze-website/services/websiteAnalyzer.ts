
import { detectChatElements } from '../utils/patternDetection.ts';
import { ChatDetectionResult } from '../types.ts';

export async function websiteAnalyzer(url: string, html: string): Promise<ChatDetectionResult> {
  try {
    console.log('[WebsiteAnalyzer] Starting analysis for URL:', url);
    
    // Check for common chat-related DOM elements and attributes
    const domBasedDetection = {
      hasIframeChatElements: /<iframe[^>]*(?:chat|messaging|support|c4a|click4assistance)[^>]*>/i.test(html),
      hasChatDivs: /<div[^>]*(?:chat-widget|chat-container|chat-box|messaging|c4a)[^>]*>/i.test(html),
      hasScriptSources: /<script[^>]*(?:chat|messaging|support|c4a|click4assistance)[^>]*>/i.test(html)
    };

    // Specifically check for Click4Assistance integration patterns
    const click4AssistancePatterns = [
      'click4assistance.co.uk',
      'C4A_btn',
      'c4a_live_chat',
      'Click4Assistance',
      'c4a_sb',
      'c4a_widget'
    ];

    const hasClick4Assistance = click4AssistancePatterns.some(pattern => 
      html.toLowerCase().includes(pattern.toLowerCase())
    );

    if (hasClick4Assistance) {
      console.log('[WebsiteAnalyzer] Detected Click4Assistance chat system');
    }

    // Check for chat-related script URLs and external resources
    const scriptUrlPatterns = [
      /chat.*\.js/i,
      /messaging.*\.js/i,
      /support.*widget/i,
      /live.*chat/i,
      /click4assistance/i,
      /c4a.*\.js/i
    ];

    const hasScriptUrls = scriptUrlPatterns.some(pattern => pattern.test(html));
    
    // Detect all chat elements using our comprehensive pattern library
    const { has_chatbot, matches } = detectChatElements(html);
    
    // Combine all detection methods for a more robust result
    const isChatbotDetected = has_chatbot || 
                             hasClick4Assistance || 
                             hasScriptUrls || 
                             domBasedDetection.hasIframeChatElements || 
                             domBasedDetection.hasChatDivs || 
                             domBasedDetection.hasScriptSources;

    console.log('[WebsiteAnalyzer] Analysis complete:', {
      url,
      has_chatbot: isChatbotDetected,
      matches,
      hasClick4Assistance,
      domBasedDetection,
      hasScriptUrls
    });

    return {
      has_chatbot: isChatbotDetected,
      chatSolutions: hasClick4Assistance ? 
        [...new Set([...matches, 'Click4Assistance'])] : 
        matches,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    console.error('[WebsiteAnalyzer] Error during analysis:', error);
    throw error;
  }
}
