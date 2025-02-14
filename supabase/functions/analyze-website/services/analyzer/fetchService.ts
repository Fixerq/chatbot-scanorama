
import { FETCH_TIMEOUT } from '../constants.ts';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

export async function tryFetch(url: string): Promise<Response> {
  console.log('[Fetch Service] Starting fetch for URL:', url);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('[Fetch Service] Timeout reached for:', url);
    controller.abort();
  }, FETCH_TIMEOUT);

  const fetchWithConfig = async (fetchUrl: string, retryCount = 0) => {
    try {
      console.log(`[Fetch Service] Attempting fetch for ${fetchUrl} (attempt ${retryCount + 1})`);
      const response = await fetch(fetchUrl, { 
        headers,
        signal: controller.signal,
        // Add these options for better SSL handling
        mode: 'no-cors',
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

      // If we haven't retried yet and it's a network error, try one more time
      if (retryCount < 1 && error.message.includes('network')) {
        console.log(`[Fetch Service] Retrying fetch for ${fetchUrl}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        return fetchWithConfig(fetchUrl, retryCount + 1);
      }
      
      throw error;
    }
  };

  try {
    // Try the original URL first with both http:// and https://
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    const protocols = ['https://', 'http://'];
    let lastError;

    for (const protocol of protocols) {
      try {
        const fetchUrl = url.replace(/^https?:\/\//, protocol);
        console.log(`[Fetch Service] Trying ${protocol} protocol:`, fetchUrl);
        const response = await fetchWithConfig(fetchUrl);
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        console.log(`[Fetch Service] Failed with ${protocol}:`, error.message);
        lastError = error;
      }
    }

    throw lastError || new Error('Failed to fetch with both HTTP and HTTPS');
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[Fetch Service] All fetch attempts failed:', error);
    throw error;
  }
}
