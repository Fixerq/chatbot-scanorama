
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
      timeout_ms: 30000,
      max_content_size_bytes: 2 * 1024 * 1024, // 2MB limit
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

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > config.max_content_size_bytes) {
      throw new Error('Content too large');
    }

    return response;
  } catch (error) {
    if (retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      console.log(`[FetchService] Retry ${retryCount + 1} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithExponentialBackoff(url, retryCount + 1, maxRetries);
    }
    throw error;
  }
}

export async function tryFetch(url: string, proxyUrl?: string): Promise<Response> {
  console.log('[FetchService] Starting fetch for:', url);
  try {
    const response = await fetchWithExponentialBackoff(url);
    console.log('[FetchService] Fetch successful for:', url);
    return response;
  } catch (error) {
    console.error('[FetchService] Final fetch error:', error);
    throw error;
  }
}
