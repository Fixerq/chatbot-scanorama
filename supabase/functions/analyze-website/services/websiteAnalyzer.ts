
import { detectChatElements } from '../utils/patternDetection.ts';
import { ChatDetectionResult } from '../types.ts';

export async function websiteAnalyzer(url: string, html: string): Promise<ChatDetectionResult> {
  try {
    console.log('[WebsiteAnalyzer] Starting analysis for URL:', url);
    
    // Check for Click4Assistance specifically
    const hasClick4Assistance = html.includes('click4assistance.co.uk') || 
                              html.includes('C4A_btn') ||
                              html.includes('c4a_live_chat');
    
    if (hasClick4Assistance) {
      console.log('[WebsiteAnalyzer] Detected Click4Assistance chat system');
    }
    
    // Detect all chat elements
    const { has_chatbot, matches } = detectChatElements(html);
    
    console.log('[WebsiteAnalyzer] Analysis complete:', {
      url,
      has_chatbot,
      matches,
      hasClick4Assistance
    });

    return {
      has_chatbot: has_chatbot || hasClick4Assistance,
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

