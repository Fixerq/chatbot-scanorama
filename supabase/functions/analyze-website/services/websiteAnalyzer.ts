
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { ChatDetectionResult, AnalysisResult } from '../types.ts';
import { detectChatElements, detectDynamicLoading, detectMetaTags, detectWebSockets, getDetailedMatches } from '../utils/patternDetection.ts';

// Create Supabase client for the edge function
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export async function websiteAnalyzer(html: string): Promise<ChatDetectionResult> {
  try {
    console.log('[WebsiteAnalyzer] Analyzing HTML content');
    
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

    // Note: We'll now store these results in analysis_results through the main handler
    // since that's where we have access to the URL and user context
    return result;
  } catch (error) {
    console.error('[WebsiteAnalyzer] Analysis error:', error);
    throw error;
  }
}
