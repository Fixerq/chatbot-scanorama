import { supabase } from '../../../src/integrations/supabase/client';
import { ChatDetectionResult, AnalysisResult } from '../types';
import { detectChatElements, detectDynamicLoading, detectMetaTags, detectWebSockets, getDetailedMatches } from '../utils/patternDetection';

export async function websiteAnalyzer(html: string, userId: string, url: string): Promise<ChatDetectionResult> {
  try {
    console.log('[WebsiteAnalyzer] Analyzing HTML content for URL:', url);
    
    const dynamic = detectDynamicLoading(html);
    const elements = detectChatElements(html);
    const meta = detectMetaTags(html);
    const websockets = detectWebSockets(html);
    const detailedMatches = getDetailedMatches(html);

    const hasChatbot = dynamic || elements || meta || websockets;
    const chatSolutions = detailedMatches.map(match => match.type);

    const result: ChatDetectionResult = {
      has_chatbot: hasChatbot,
      chatSolutions,
      details: {
        matchTypes: {
          dynamic,
          elements,
          meta,
          websockets
        },
        matches: detailedMatches.map(match => ({
          type: match.type,
          pattern: match.pattern.toString()
        }))
      },
      lastChecked: new Date().toISOString()
    };

    // Save analysis result to the database
    const { error: insertError } = await supabase
      .from('analysis_results')
      .insert({
        url,
        user_id: userId,
        has_chatbot: result.has_chatbot,
        chatbot_solutions: result.chatSolutions,
        details: result.details,
        last_checked: result.lastChecked
      });

    if (insertError) {
      console.error('[WebsiteAnalyzer] Error saving analysis result:', insertError);
      throw new Error(`Failed to save analysis result: ${insertError.message}`);
    }

    return result;
  } catch (error) {
    console.error('[WebsiteAnalyzer] Analysis error:', error);
    throw error;
  }
}
