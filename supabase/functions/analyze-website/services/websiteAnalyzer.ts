
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
    console.log('[WebsiteAnalyzer] Starting analysis of HTML content');
    
    const dynamic = detectDynamicLoading(html);
    console.log('[WebsiteAnalyzer] Dynamic loading detected:', dynamic);
    
    const elements = detectChatElements(html);
    console.log('[WebsiteAnalyzer] Chat elements detected:', elements);
    
    const meta = detectMetaTags(html);
    console.log('[WebsiteAnalyzer] Meta tags detected:', meta);
    
    const websockets = detectWebSockets(html);
    console.log('[WebsiteAnalyzer] WebSocket usage detected:', websockets);
    
    const detailedMatches = getDetailedMatches(html);
    console.log('[WebsiteAnalyzer] Detailed matches:', detailedMatches);

    const hasChatbot = dynamic || elements || meta || websockets || detailedMatches.length > 0;
    const chatSolutions = detailedMatches.map(match => match.type);

    console.log('[WebsiteAnalyzer] Analysis results:', {
      hasChatbot,
      chatSolutions,
      matchTypes: {
        dynamic,
        elements,
        meta,
        websockets
      }
    });

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

    return result;
  } catch (error) {
    console.error('[WebsiteAnalyzer] Analysis error:', error);
    throw error;
  }
}
