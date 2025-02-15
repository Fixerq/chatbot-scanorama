
import { corsHeaders } from '../../utils/httpUtils.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface FetchConfig {
  timeout_ms: number;
  max_content_size_bytes: number;
  max_redirects: number;
  retry_delay_ms: number;
  max_retries: number;
}

async function getFetchConfig(): Promise<FetchConfig> {
  try {
    const { data, error } = await supabase
      .from('runtime_config')
      .select('value')
      .eq('key', 'fetch_config')
      .single();

    if (error) {
      console.error('[FetchService] Error fetching config:', error);
      throw error;
    }

    return data.value as FetchConfig;
  } catch (error) {
    console.error('[FetchService] Error loading config:', error);
    // Return default values if config cannot be loaded
    return {
      timeout_ms: 30000, // Increased timeout
      max_content_size_bytes: 10485760, // Increased max size to 10MB
      max_redirects: 5,
      retry_delay_ms: 1000,
      max_retries: 3
    };
  }
}

async function fetchWithRetry(url: string, proxyUrl?: string): Promise<Response> {
  const config = await getFetchConfig();
  let lastError;
  
  for (let i = 0; i < config.max_retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout_ms);

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'DNT': '1'
      };

      const fetchOptions: RequestInit = {
        method: 'GET',
        headers,
        redirect: 'follow',
        signal: controller.signal,
        keepalive: true
      };

      console.log(`[FetchService] Attempt ${i + 1}: Starting fetch for URL:`, url);
      
      let response: Response;
      if (proxyUrl) {
        console.log('[FetchService] Using proxy:', proxyUrl);
        response = await fetch(proxyUrl, {
          method: 'POST',
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, options: fetchOptions })
        });
      } else {
        response = await fetch(url, fetchOptions);
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle redirects
      let redirectCount = 0;
      while (redirectCount < config.max_redirects && 
             [301, 302, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) break;
        
        console.log(`[FetchService] Following redirect ${redirectCount + 1} to:`, location);
        const redirectUrl = new URL(location, url).toString();
        response = await fetch(redirectUrl, fetchOptions);
        redirectCount++;
      }

      const contentLength = parseInt(response.headers.get('content-length') || '0');
      if (contentLength > config.max_content_size_bytes) {
        throw new Error(`Content size exceeds limit: ${contentLength} bytes`);
      }

      // Ensure we get HTML content
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('text/html')) {
        console.warn('[FetchService] Non-HTML content type:', contentType);
      }

      // Clone the response before checking the body
      const clonedResponse = response.clone();
      const text = await clonedResponse.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response body');
      }

      if (!text.includes('<html') && !text.includes('<!DOCTYPE')) {
        console.warn('[FetchService] Response may not be valid HTML');
      }

      console.log('[FetchService] Successfully fetched content, length:', text.length);
      return new Response(text, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

    } catch (error) {
      console.error(`[FetchService] Attempt ${i + 1} failed:`, error);
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.log('[FetchService] Request timed out');
      }
      
      if (i < config.max_retries - 1) {
        const backoffDelay = Math.min(config.retry_delay_ms * Math.pow(2, i), 5000);
        console.log(`[FetchService] Waiting ${backoffDelay}ms before next attempt`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  throw lastError;
}

export async function tryFetch(url: string, proxyUrl?: string): Promise<Response> {
  console.log('[FetchService] Starting fetch for:', url);
  try {
    const response = await fetchWithRetry(url, proxyUrl);
    console.log('[FetchService] Fetch successful for:', url);
    return response;
  } catch (error) {
    console.error('[FetchService] Final fetch error:', error);
    throw error;
  }
}

