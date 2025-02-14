
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

  try {
    // Try the original URL first
    console.log('[Fetch Service] Attempting initial fetch for:', url);
    const response = await fetch(url, { 
      headers,
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('[Fetch Service] Successful fetch for:', url);
      return response;
    }
    
    console.log(`[Fetch Service] Initial fetch failed for ${url} with status ${response.status}`);
    
    // If the response is a redirect, follow it
    if (response.status === 301 || response.status === 302) {
      const redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        console.log(`[Fetch Service] Following redirect to ${redirectUrl}`);
        const redirectResponse = await fetch(redirectUrl, { 
          headers,
          signal: controller.signal 
        });
        if (redirectResponse.ok) {
          console.log('[Fetch Service] Successful redirect fetch');
          return redirectResponse;
        }
      }
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[Fetch Service] Failed to fetch ${url}:`, error);
    
    if (error.name === 'AbortError') {
      throw new Error(`Timeout after ${FETCH_TIMEOUT}ms fetching ${url}`);
    }
  }

  // If http://, try https://
  if (url.startsWith('http://')) {
    try {
      const httpsUrl = url.replace('http://', 'https://');
      console.log('[Fetch Service] Trying HTTPS version:', httpsUrl);
      const response = await fetch(httpsUrl, { 
        headers,
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('[Fetch Service] Successful HTTPS fetch');
        return response;
      }
      console.log(`[Fetch Service] HTTPS attempt failed with status ${response.status}`);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[Fetch Service] HTTPS attempt failed:', error);
      
      if (error.name === 'AbortError') {
        throw new Error(`Timeout after ${FETCH_TIMEOUT}ms fetching HTTPS version`);
      }
    }
  }

  // If still not successful, try the other protocol
  const alternateUrl = url.startsWith('https://') 
    ? url.replace('https://', 'http://')
    : url.replace('http://', 'https://');

  console.log('[Fetch Service] Trying alternate protocol:', alternateUrl);
  try {
    const response = await fetch(alternateUrl, { 
      headers,
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch website (status: ${response.status}). Tried both HTTP and HTTPS.`);
    }
    
    console.log('[Fetch Service] Successful alternate protocol fetch');
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Timeout after ${FETCH_TIMEOUT}ms fetching alternate protocol`);
    }
    throw error;
  }
}
