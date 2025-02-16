
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
    // Even more conservative default values
    return {
      timeout_ms: 10000, // Reduced to 10 seconds
      max_content_size_bytes: 512 * 1024, // Reduced to 512KB
      max_redirects: 2,
      retry_delay_ms: 2000,
      max_retries: 1
    };
  }
}

async function fetchWithExponentialBackoff(url: string, retryCount = 0, maxRetries = 1): Promise<Response> {
  try {
    const config = await getFetchConfig();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout_ms);

    console.log(`[FetchService] Attempting to fetch ${url} (attempt ${retryCount + 1}/${maxRetries + 1})`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AnalyzerBot/1.0)',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      redirect: 'follow',
      signal: controller.signal,
      credentials: 'omit'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > config.max_content_size_bytes) {
      throw new Error('Content too large');
    }

    // Stream the response to reduce memory usage
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Unable to read response');
    }

    let content = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Convert Uint8Array to string and append
      content += new TextDecoder().decode(value);
      
      // Check size limit while streaming
      if (content.length > config.max_content_size_bytes) {
        reader.cancel();
        throw new Error('Content too large');
      }
    }

    return new Response(content, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });

  } catch (error) {
    console.error(`[FetchService] Error fetching ${url}:`, error);

    if (retryCount < maxRetries && 
        !error.message.includes('forbidden') && 
        !error.message.includes('blocking')) {
      const delay = Math.min(2000 * Math.pow(2, retryCount), 5000);
      console.log(`[FetchService] Retry ${retryCount + 1} after ${delay}ms for URL: ${url}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithExponentialBackoff(url, retryCount + 1, maxRetries);
    }

    throw error;
  }
}

export async function tryFetch(url: string): Promise<Response> {
  console.log('[FetchService] Starting fetch for:', url);
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid URL protocol');
    }

    const response = await fetchWithExponentialBackoff(url);
    console.log('[FetchService] Fetch successful for:', url);
    return response;
  } catch (error) {
    console.error('[FetchService] Final fetch error:', error);
    
    let errorMessage = error.message;
    if (error.name === 'TypeError' && error.message.includes('sending request')) {
      errorMessage = 'Website is not accessible or blocking access';
    }
    
    const enhancedError = new Error(errorMessage);
    enhancedError.name = error.name;
    throw enhancedError;
  }
}

