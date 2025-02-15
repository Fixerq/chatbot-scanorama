
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
    console.log('[WebsiteAnalyzer] HTML content length:', html.length);
    console.log('[WebsiteAnalyzer] First 500 characters:', html.substring(0, 500));
    
    // Check if HTML content is valid
    if (!html || html.trim().length === 0) {
      console.error('[WebsiteAnalyzer] Empty or invalid HTML content received');
      throw new Error('Empty or invalid HTML content');
    }

    // Check for basic HTML structure
    if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
      console.warn('[WebsiteAnalyzer] HTML content may be incomplete or malformed');
    }
    
    const dynamic = detectDynamicLoading(html);
    console.log('[WebsiteAnalyzer] Dynamic loading detected:', dynamic);
    
    const elements = detectChatElements(html);
    console.log('[WebsiteAnalyzer] Chat elements detected:', elements);
    
    const meta = detectMetaTags(html);
    console.log('[WebsiteAnalyzer] Meta tags detected:', meta);
    
    const websockets = detectWebSockets(html);
    console.log('[WebsiteAnalyzer] WebSocket usage detected:', websockets);
    
    const detailedMatches = getDetailedMatches(html);
    console.log('[WebsiteAnalyzer] Detailed matches:', JSON.stringify(detailedMatches, null, 2));

    const hasChatbot = dynamic || elements || meta || websockets || detailedMatches.length > 0;
    const chatSolutions = detailedMatches.map(match => match.type);

    console.log('[WebsiteAnalyzer] Final analysis results:', {
      hasChatbot,
      chatSolutions,
      matchTypes: {
        dynamic,
        elements,
        meta,
        websockets
      },
      detailedMatches: detailedMatches.map(m => ({
        type: m.type,
        pattern: m.pattern.toString(),
        matched: m.matched
      }))
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
    console.error('[WebsiteAnalyzer] Error stack:', error.stack);
    throw error;
  }
}
