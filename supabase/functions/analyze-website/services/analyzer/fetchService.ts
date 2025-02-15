
import { corsHeaders } from '../../utils/httpUtils.ts';

async function fetchWithRetry(url: string, proxyUrl?: string, retries = 3): Promise<Response> {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      const timeout = 20000; // Keep short timeout to prevent resource exhaustion
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip',
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
        keepalive: false,
        referrerPolicy: 'no-referrer'
      };

      if (proxyUrl) {
        console.log(`[FetchService] Attempt ${i + 1}: Fetching through proxy: ${proxyUrl}`);
        try {
          const proxyResponse = await fetch(proxyUrl, {
            method: 'POST',
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              url, 
              options: {
                ...fetchOptions,
                signal: undefined
              }
            })
          });

          if (!proxyResponse.ok) {
            throw new Error(`Proxy request failed: ${proxyResponse.status} ${proxyResponse.statusText}`);
          }

          clearTimeout(timeoutId);
          return proxyResponse;
        } catch (proxyError) {
          console.error(`[FetchService] Proxy attempt ${i + 1} failed:`, proxyError);
          throw proxyError;
        }
      }

      console.log(`[FetchService] Attempt ${i + 1}: Direct fetch for URL: ${url}`);
      
      const attempts = [
        () => fetch(url.replace(/^http:/, 'https:'), fetchOptions),
        () => fetch(url.replace(/^https:/, 'http:'), fetchOptions),
        () => fetch(url.toLowerCase(), fetchOptions),
        () => fetch(url.replace(/\/$/, ''), fetchOptions)
      ];

      let response: Response | null = null;
      
      for (const attempt of attempts) {
        try {
          response = await attempt();
          if (response.ok) break;
        } catch (err) {
          console.log('[FetchService] Attempt failed, trying next variation');
          continue;
        }
      }

      if (!response) {
        throw new Error('All fetch attempts failed');
      }
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      let redirectCount = 0;
      let currentResponse = response;
      
      while (redirectCount < 3 && (currentResponse.status === 301 || currentResponse.status === 302 || currentResponse.status === 307 || currentResponse.status === 308)) {
        const redirectUrl = currentResponse.headers.get('location');
        if (!redirectUrl) break;
        
        console.log(`[FetchService] Following redirect ${redirectCount + 1} to: ${redirectUrl}`);
        
        const nextUrl = redirectUrl.startsWith('http') ? redirectUrl : new URL(redirectUrl, url).toString();
        currentResponse = await fetch(nextUrl, fetchOptions);
        redirectCount++;
      }
      
      return currentResponse;
    } catch (error) {
      console.error(`[FetchService] Attempt ${i + 1} failed:`, error);
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.log('[FetchService] Request timed out');
      } else if (error.cause?.code === 'ECONNREFUSED') {
        console.log('[FetchService] Connection refused');
      } else if (error.cause?.code === 'ETIMEDOUT') {
        console.log('[FetchService] Connection timed out');
      } else if (error.message.includes('ssl')) {
        console.log('[FetchService] SSL/TLS error');
      }
      
      if (i === retries - 1) {
        const errorMessage = `Failed to fetch after ${retries} attempts: ${error.message}`;
        console.error('[FetchService] All attempts failed:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const backoffDelay = Math.min(1000 * Math.pow(2, i), 5000);
      console.log(`[FetchService] Waiting ${backoffDelay}ms before next attempt`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }

  throw lastError;
}

export async function tryFetch(url: string, proxyUrl?: string): Promise<Response> {
  try {
    console.log('[FetchService] Starting fetch for:', url);
    const response = await fetchWithRetry(url, proxyUrl);
    console.log('[FetchService] Fetch successful for:', url);
    return response;
  } catch (error) {
    console.error('[FetchService] Final fetch error:', error);
    throw error;
  }
}
