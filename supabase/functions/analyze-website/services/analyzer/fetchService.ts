
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
      timeout_ms: 15000, // Reduced timeout to 15 seconds
      max_content_size_bytes: 1 * 1024 * 1024, // Reduced to 1MB limit
      max_redirects: 3,
      retry_delay_ms: 1000,
      max_retries: 2
    };
  }
}

async function fetchWithExponentialBackoff(url: string, retryCount = 0, maxRetries = 2): Promise<Response> {
  try {
    const config = await getFetchConfig();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout_ms);

    console.log(`[FetchService] Attempting to fetch ${url} (attempt ${retryCount + 1}/${maxRetries + 1})`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow',
      signal: controller.signal,
      credentials: 'omit'
    });

    clearTimeout(timeoutId);

    // Handle common HTTP errors
    if (!response.ok) {
      const errorMessage = `HTTP error! status: ${response.status}`;
      console.error(`[FetchService] ${errorMessage} for URL: ${url}`);
      
      // Special handling for specific status codes
      if (response.status === 403) {
        throw new Error('Access forbidden - website blocking access');
      } else if (response.status === 429) {
        throw new Error('Rate limited by website');
      } else if (response.status >= 500) {
        throw new Error('Website server error');
      }
      
      throw new Error(errorMessage);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > config.max_content_size_bytes) {
      throw new Error('Content too large');
    }

    return response;
  } catch (error) {
    console.error(`[FetchService] Error fetching ${url}:`, error);

    // Check if we should retry
    if (retryCount < maxRetries && 
        !error.message.includes('forbidden') && 
        !error.message.includes('blocking')) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
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
    // Validate URL format
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid URL protocol');
    }

    const response = await fetchWithExponentialBackoff(url);
    console.log('[FetchService] Fetch successful for:', url);
    return response;
  } catch (error) {
    console.error('[FetchService] Final fetch error:', error);
    
    // Enhance error message based on the error type
    let errorMessage = error.message;
    if (error.name === 'TypeError' && error.message.includes('sending request')) {
      errorMessage = 'Website is not accessible or blocking access';
    }
    
    const enhancedError = new Error(errorMessage);
    enhancedError.name = error.name;
    throw enhancedError;
  }
}
