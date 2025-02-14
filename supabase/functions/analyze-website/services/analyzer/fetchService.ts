
import { FETCH_TIMEOUT } from '../constants.ts';

// Expanded list of user agents including mobile browsers
const USER_AGENTS = [
  // Desktop Chrome
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  // Desktop Firefox
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0',
  // Mobile browsers
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.119 Mobile Safari/537.36'
];

const getRandomUserAgent = () => {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
};

export async function tryFetch(url: string): Promise<Response> {
  console.log('[Fetch Service] Starting fetch for URL:', url);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('[Fetch Service] Timeout reached for:', url);
    controller.abort();
  }, FETCH_TIMEOUT);

  const fetchWithConfig = async (fetchUrl: string, retryCount = 0): Promise<Response> => {
    // More extensive browser-like headers
    const headers = {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    };

    try {
      console.log(`[Fetch Service] Attempting fetch for ${fetchUrl} (attempt ${retryCount + 1})`);
      
      // Add a small random delay before each request to avoid rate limiting
      const randomDelay = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
      await new Promise(resolve => setTimeout(resolve, randomDelay));

      const response = await fetch(fetchUrl, { 
        headers,
        signal: controller.signal,
        redirect: 'follow'
      });
      
      if (response.ok) {
        console.log(`[Fetch Service] Successful fetch for ${fetchUrl}`);
        return response;
      }
      
      console.log(`[Fetch Service] Fetch failed with status ${response.status} for ${fetchUrl}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      console.error(`[Fetch Service] Error fetching ${fetchUrl}:`, error);
      
      if (error.name === 'AbortError') {
        throw new Error(`Timeout after ${FETCH_TIMEOUT}ms fetching ${fetchUrl}`);
      }

      // Enhanced retry logic for specific types of errors
      if (retryCount < 3 && (
        error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('network') ||
        error.message.includes('certificate') ||
        error.status === 403 ||
        error.status === 429 ||
        error.status === 503
      )) {
        console.log(`[Fetch Service] Retrying fetch for ${fetchUrl} after error: ${error.message}`);
        const delay = Math.pow(2, retryCount) * 2000; // Exponential backoff starting at 2 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithConfig(fetchUrl, retryCount + 1);
      }
      
      throw error;
    }
  };

  try {
    // Try HTTPS first, then HTTP if needed
    const protocols = ['https://', 'http://'];
    let lastError;
    const normalizedUrl = url.replace(/^https?:\/\//, '');

    for (const protocol of protocols) {
      try {
        const fetchUrl = `${protocol}${normalizedUrl}`;
        console.log(`[Fetch Service] Trying ${protocol} protocol:`, fetchUrl);
        const response = await fetchWithConfig(fetchUrl);
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        console.log(`[Fetch Service] Failed with ${protocol}:`, error.message);
        lastError = error;
        
        // Only try HTTP if HTTPS failed due to certificate/SSL issues
        if (!error.message.includes('certificate') && 
            !error.message.includes('SSL') && 
            !error.message.includes('CERT_')) {
          throw error;
        }
      }
    }

    throw lastError || new Error('Failed to fetch with both HTTP and HTTPS');
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[Fetch Service] All fetch attempts failed:', error);
    throw error;
  }
}
