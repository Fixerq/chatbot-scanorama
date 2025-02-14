
import { FETCH_TIMEOUT } from '../constants.ts';

// Rotate between different common user agents to avoid blocking
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
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
    const headers = {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };

    try {
      console.log(`[Fetch Service] Attempting fetch for ${fetchUrl} (attempt ${retryCount + 1})`);
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

      // Retry logic for specific types of errors
      if (retryCount < 2 && (
        error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('network') ||
        error.message.includes('certificate') ||
        error.status === 503 ||
        error.status === 429
      )) {
        console.log(`[Fetch Service] Retrying fetch for ${fetchUrl} after error: ${error.message}`);
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithConfig(fetchUrl, retryCount + 1);
      }
      
      throw error;
    }
  };

  try {
    // Try both HTTPS and HTTP if needed
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
        
        // If it's not a protocol-related error, don't try other protocols
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
