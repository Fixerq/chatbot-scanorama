
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { ChatDetectionResult, AnalysisResult } from '../types.ts';
import { detectChatElements, detectDynamicLoading, detectMetaTags, detectWebSockets, getDetailedMatches } from '../utils/patternDetection.ts';

// Create Supabase client for the edge function
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

async function updateAnalysisRequest(requestId: string, updates: Record<string, any>) {
  const { error } = await supabase
    .from('analysis_requests')
    .update(updates)
    .eq('id', requestId);
  
  if (error) {
    console.error('[WebsiteAnalyzer] Error updating analysis request:', error);
  }
}

export async function websiteAnalyzer(html: string, requestId?: string): Promise<ChatDetectionResult> {
  try {
    console.log('[WebsiteAnalyzer] Starting analysis of HTML content');
    
    // Record HTML content details
    if (requestId) {
      await updateAnalysisRequest(requestId, {
        html_content_length: html?.length || 0,
        analysis_step: 'initializing'
      });
    }

    // Validate HTML content
    if (!html || html.trim().length === 0) {
      const error = new Error('Empty or invalid HTML content');
      if (requestId) {
        await updateAnalysisRequest(requestId, {
          error_message: error.message,
          html_fetch_status: 'invalid_content',
          status: 'failed'
        });
      }
      throw error;
    }

    // Check for basic HTML structure
    if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
      console.warn('[WebsiteAnalyzer] HTML content may be incomplete or malformed');
      if (requestId) {
        await updateAnalysisRequest(requestId, {
          analysis_step: 'validation',
          html_fetch_status: 'malformed'
        });
      }
    }

    // Log progress
    console.log('[WebsiteAnalyzer] Starting pattern detection');
    if (requestId) {
      await updateAnalysisRequest(requestId, {
        analysis_step: 'pattern_detection'
      });
    }
    
    // Detect patterns
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

    // Update analysis step
    if (requestId) {
      await updateAnalysisRequest(requestId, {
        analysis_step: 'analyzing_results'
      });
    }

    const hasChatbot = dynamic || elements || meta || websockets || detailedMatches.length > 0;
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

    // Log final results
    console.log('[WebsiteAnalyzer] Analysis complete:', {
      hasChatbot,
      chatSolutions,
      matchDetails: result.details
    });

    // Update request with success
    if (requestId) {
      await updateAnalysisRequest(requestId, {
        analysis_step: 'completed',
        status: 'completed',
        analysis_result: result,
        completed_at: new Date().toISOString()
      });
    }

    return result;
  } catch (error) {
    console.error('[WebsiteAnalyzer] Analysis error:', error);
    console.error('[WebsiteAnalyzer] Error stack:', error.stack);

    // Update request with error details
    if (requestId) {
      await updateAnalysisRequest(requestId, {
        status: 'failed',
        error_message: error.message,
        error_details: {
          stack: error.stack,
          name: error.name
        },
        completed_at: new Date().toISOString()
      });

      // Also log to analysis_failures table for monitoring
      const { error: insertError } = await supabase
        .from('analysis_failures')
        .insert({
          url: null, // Add URL if available in your context
          status: 'failed',
          error_message: error.message,
          error_details: {
            stack: error.stack,
            name: error.name
          },
          analysis_step: 'pattern_detection',
          html_content_length: html?.length || 0,
          completed_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('[WebsiteAnalyzer] Error logging failure:', insertError);
      }
    }

    throw error;
  }
}
