
import { corsHeaders } from '../../utils/httpUtils.ts';

async function fetchWithRetry(url: string, proxyUrl?: string, retries = 3): Promise<Response> {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };

      const fetchOptions: RequestInit = {
        method: 'GET',
        headers,
        redirect: 'follow',
      };

      if (proxyUrl) {
        console.log(`[FetchService] Attempting fetch through proxy: ${proxyUrl}`);
        const proxyResponse = await fetch(proxyUrl, {
          method: 'POST',
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, options: fetchOptions })
        });

        if (!proxyResponse.ok) {
          throw new Error(`Proxy request failed: ${proxyResponse.status} ${proxyResponse.statusText}`);
        }

        return proxyResponse;
      }

      console.log(`[FetchService] Attempting direct fetch: ${url}`);
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      console.error(`[FetchService] Attempt ${i + 1} failed:`, error);
      lastError = error;
      
      if (i === retries - 1) {
        throw new Error(`Failed to fetch after ${retries} attempts: ${lastError.message}`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }

  throw lastError;
}

export async function tryFetch(url: string, proxyUrl?: string): Promise<Response> {
  try {
    console.log('[FetchService] Starting fetch for:', url);
    const response = await fetchWithRetry(url, proxyUrl);
    console.log('[FetchService] Fetch successful');
    return response;
  } catch (error) {
    console.error('[FetchService] Final fetch error:', error);
    throw error;
  }
}
