import { ChatDetectionResult } from '../types.ts';
import { tryFetch } from './analyzer/fetchService.ts';
import { processContent } from './analyzer/contentProcessor.ts';
import { processUrl } from './urlProcessor.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface AnalysisConfig {
  max_concurrent_requests: number;
  request_timeout_ms: number;
  max_batch_size: number;
}

async function getAnalysisConfig(): Promise<AnalysisConfig> {
  try {
    const { data, error } = await supabase
      .from('runtime_config')
      .select('value')
      .eq('key', 'analysis_config')
      .single();

    if (error) {
      console.error('[Analyzer] Error fetching config:', error);
      throw error;
    }

    return data.value as AnalysisConfig;
  } catch (error) {
    console.error('[Analyzer] Error loading config:', error);
    // Return default values if config cannot be loaded
    return {
      max_concurrent_requests: 3,
      request_timeout_ms: 20000,
      max_batch_size: 10
    };
  }
}

async function logBlockedRequest(
  url: string, 
  error: Error, 
  headers: Headers,
  proxyId?: string,
) {
  try {
    const blockReason = error.message.toLowerCase().includes('403') ? 'forbidden_403' :
                       error.message.toLowerCase().includes('429') ? 'rate_limit_429' :
                       error.message.toLowerCase().includes('timeout') ? 'timeout' :
                       error.message.toLowerCase().includes('refused') ? 'connection_refused' :
                       error.message.toLowerCase().includes('dns') ? 'dns_error' : 'other';

    await supabase.from('blocked_requests').insert({
      website_url: url,
      block_reason: blockReason,
      error_details: error.message,
      headers: Object.fromEntries(headers.entries()),
      user_agent: headers.get('User-Agent'),
      proxy_used: proxyId,
      retry_count: 0,
      resolved: false
    });

    if (proxyId) {
      await supabase.rpc('update_proxy_status', {
        p_proxy_id: proxyId,
        p_success: false
      });
    }
  } catch (dbError) {
    console.error('Error logging blocked request:', dbError);
  }
}

async function saveAnalysisResult(
  url: string,
  result: ChatDetectionResult,
  userId?: string
) {
  if (!userId) {
    console.log('[Analyzer] No user ID provided, skipping result storage');
    return;
  }

  try {
    const { error } = await supabase.from('analysis_results').insert({
      url,
      status: result.status,
      has_chatbot: result.has_chatbot,
      chatbot_solutions: result.chatSolutions,
      details: result.details,
      last_checked: result.lastChecked,
      user_id: userId
    });

    if (error) {
      console.error('[Analyzer] Error saving analysis result:', error);
      throw error;
    }

    console.log('[Analyzer] Successfully saved analysis result for:', url);
  } catch (error) {
    console.error('[Analyzer] Failed to save analysis result:', error);
    throw error;
  }
}

export async function websiteAnalyzer(url: string, userId?: string): Promise<ChatDetectionResult> {
  console.log('[Analyzer] Starting analysis for:', url);
  
  try {
    const config = await getAnalysisConfig();
    
    // Process and validate URL
    const { cleanUrl, urlObj } = await processUrl(url);
    console.log('[Analyzer] Processed URL:', cleanUrl, 'Original URL:', url);
    
    // Get a proxy from the pool
    const { data: proxyData, error: proxyError } = await supabase
      .rpc('get_next_available_proxy')
      .single();

    if (proxyError) {
      console.error('[Analyzer] Error getting proxy:', proxyError);
    }

    // Create an abort controller for the overall request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.request_timeout_ms);

    try {
      // Fetch and process the content
      console.log('[Analyzer] Attempting to fetch content from:', urlObj.toString());
      console.log('[Analyzer] Using proxy:', proxyData?.proxy_url);
      
      const response = await tryFetch(urlObj.toString(), proxyData?.proxy_url);
      
      if (!response.ok) {
        console.error('[Analyzer] Fetch failed:', response.status, response.statusText);
        await logBlockedRequest(
          cleanUrl,
          new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`),
          response.headers,
          proxyData?.proxy_id
        );
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }

      // Update proxy success status
      if (proxyData?.proxy_id) {
        await supabase.rpc('update_proxy_status', {
          p_proxy_id: proxyData.proxy_id,
          p_success: true
        });
      }
      
      console.log('[Analyzer] Successfully fetched content, getting reader');
      const reader = response.body?.getReader();
      if (!reader) {
        console.error('[Analyzer] Could not get response body reader');
        throw new Error('Could not get response body reader');
      }

      console.log('[Analyzer] Processing content for:', cleanUrl);
      
      const {
        hasDynamicChat,
        hasChatElements,
        hasMetaTags,
        hasWebSockets,
        detectedSolutions,
        liveElements
      } = await processContent(reader);

      console.log('[Analyzer] Content processing results:', {
        hasDynamicChat,
        hasChatElements,
        hasMetaTags,
        hasWebSockets,
        detectedSolutions: detectedSolutions.length,
        liveElements: liveElements.length
      });

      const has_chatbot = hasDynamicChat || hasChatElements || hasMetaTags || hasWebSockets || detectedSolutions.length > 0;
      const has_live_elements = liveElements.length > 0;

      console.log('[Analyzer] Analysis complete:', {
        url: cleanUrl,
        has_chatbot,
        has_live_elements,
        detectedSolutions,
        liveElements: liveElements.length
      });

      const result = {
        status: 'success',
        has_chatbot,
        has_live_elements,
        chatSolutions: detectedSolutions,
        liveElements,
        details: {
          dynamic_loading: hasDynamicChat,
          chat_elements: hasChatElements,
          meta_tags: hasMetaTags,
          websockets: hasWebSockets,
          url: cleanUrl
        },
        lastChecked: new Date().toISOString()
      };

      // Save the result to the database
      await saveAnalysisResult(cleanUrl, result, userId);

      return result;

    } finally {
      clearTimeout(timeoutId);
    }

  } catch (error) {
    console.error('[Analyzer] Error analyzing website:', error);
    throw error;
  }
}
