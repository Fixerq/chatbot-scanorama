
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { ChatDetectionResult, AnalysisResult } from '../types.ts';
import { detectChatElements, detectDynamicLoading, detectMetaTags, detectWebSockets, getDetailedMatches } from '../utils/patternDetection.ts';

// Create Supabase client for the edge function
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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

    // Save analysis result to the database with match details and status
    const { error: insertError } = await supabase
      .from('analysis_results')
      .insert({
        url,
        user_id: userId,
        has_chatbot: result.has_chatbot,
        chatbot_solutions: result.chatSolutions,
        details: result.details,
        match_details: {
          matchTypes: {
            dynamic,
            elements,
            meta,
            websockets
          },
          matches: detailedMatches.map(match => ({
            type: match.type,
            pattern: match.pattern.toString(),
            matched: match.matched || null
          }))
        },
        last_checked: result.lastChecked,
        status: 'completed'
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
