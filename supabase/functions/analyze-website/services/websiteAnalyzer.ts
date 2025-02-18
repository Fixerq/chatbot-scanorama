
import { detectChatElements } from '../utils/patternDetection.ts';
import { ChatDetectionResult } from '../types.ts';

export async function websiteAnalyzer(url: string, html: string): Promise<ChatDetectionResult> {
  try {
    console.log('[WebsiteAnalyzer] Starting analysis for URL:', url);
    
    // Detect chat elements
    const { has_chatbot, matches } = detectChatElements(html);
    
    console.log('[WebsiteAnalyzer] Analysis complete:', {
      url,
      has_chatbot,
      matches
    });

    return {
      has_chatbot,
      chatSolutions: matches,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    console.error('[WebsiteAnalyzer] Error during analysis:', error);
    throw error;
  }
}
