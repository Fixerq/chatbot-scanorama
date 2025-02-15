
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { ChatDetectionResult, AnalysisResult } from '../types.ts';
import { detectChatElements, detectDynamicLoading, detectMetaTags, detectWebSockets, getDetailedMatches } from '../utils/patternDetection.ts';
import { tryFetch } from '../services/analyzer/fetchService.ts';
import { getCachedPatterns, setCachedPatterns } from './patternCache.ts';

// Create Supabase client for the edge function
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

async function updateAnalysisRequest(requestId: string, updates: Record<string, any>) {
  try {
    const { error } = await supabase
      .from('analysis_requests')
      .update(updates)
      .eq('id', requestId);
    
    if (error) {
      console.error('[WebsiteAnalyzer] Error updating analysis request:', error);
    }
  } catch (error) {
    console.error('[WebsiteAnalyzer] Unexpected error updating request:', error);
  }
}

export async function websiteAnalyzer(url: string, requestId?: string): Promise<ChatDetectionResult> {
  const MAX_HTML_SIZE = 2 * 1024 * 1024; // 2MB limit
  const TIMEOUT = 20000; // 20 seconds timeout

  try {
    console.log('[WebsiteAnalyzer] Starting analysis for URL:', url);

    if (requestId) {
      await updateAnalysisRequest(requestId, {
        started_at: new Date().toISOString(),
        status: 'processing',
        analysis_step: 'initializing'
      });
    }

    // Fetch HTML content with timeout
    let html = '';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

      const response = await tryFetch(url);
      clearTimeout(timeoutId);

      // Check content length before downloading
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > MAX_HTML_SIZE) {
        throw new Error('Content too large to process');
      }

      html = await response.text();
      
      if (requestId) {
        await updateAnalysisRequest(requestId, {
          html_content_length: html?.length || 0,
          html_fetch_status: 'success',
          analysis_step: 'content_fetched'
        });
      }
    } catch (fetchError) {
      console.error('[WebsiteAnalyzer] Error fetching HTML:', fetchError);
      if (requestId) {
        await updateAnalysisRequest(requestId, {
          error_message: fetchError.message,
          html_fetch_status: 'failed',
          status: 'failed'
        });
      }
      throw fetchError;
    }

    // Validate HTML content size
    if (html.length > MAX_HTML_SIZE) {
      const error = new Error('HTML content exceeds size limit');
      if (requestId) {
        await updateAnalysisRequest(requestId, {
          error_message: error.message,
          html_fetch_status: 'content_too_large',
          status: 'failed'
        });
      }
      throw error;
    }

    if (requestId) {
      await updateAnalysisRequest(requestId, {
        analysis_step: 'pattern_detection'
      });
    }
    
    // Get cached patterns or load new ones
    let patterns = getCachedPatterns();
    if (!patterns) {
      // Run pattern detection in parallel
      const results = await Promise.all([
        detectDynamicLoading(html),
        detectChatElements(html),
        detectMetaTags(html),
        detectWebSockets(html)
      ]);
      patterns = results;
      setCachedPatterns(patterns);
    }

    const [dynamic, elements, meta, websockets] = patterns;
    const detailedMatches = getDetailedMatches(html);

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
          pattern: match.pattern.toString(),
          matched: match.matched
        }))
      },
      lastChecked: new Date().toISOString()
    };

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
    }

    throw error;
  }
}
