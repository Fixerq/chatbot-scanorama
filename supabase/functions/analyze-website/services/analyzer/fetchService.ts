
import { FETCH_TIMEOUT } from '../constants.ts';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

export async function tryFetch(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    // Try the original URL first
    const response = await fetch(url, { 
      headers,
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) return response;
    
    console.log(`Initial fetch failed for ${url} with status ${response.status}`);
    
    // If the response is a redirect, follow it
    if (response.status === 301 || response.status === 302) {
      const redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        console.log(`Following redirect to ${redirectUrl}`);
        const redirectResponse = await fetch(redirectUrl, { 
          headers,
          signal: controller.signal 
        });
        if (redirectResponse.ok) return redirectResponse;
      }
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.log(`Failed to fetch ${url}:`, error);
    
    if (error.name === 'AbortError') {
      throw new Error(`Timeout after ${FETCH_TIMEOUT}ms fetching ${url}`);
    }
  }

  // If http://, try https://
  if (url.startsWith('http://')) {
    try {
      const httpsUrl = url.replace('http://', 'https://');
      console.log('Trying HTTPS version:', httpsUrl);
      const response = await fetch(httpsUrl, { 
        headers,
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (response.ok) return response;
      console.log(`HTTPS attempt failed with status ${response.status}`);
    } catch (error) {
      clearTimeout(timeoutId);
      console.log('HTTPS attempt failed:', error);
      
      if (error.name === 'AbortError') {
        throw new Error(`Timeout after ${FETCH_TIMEOUT}ms fetching HTTPS version`);
      }
    }
  }

  // If still not successful, try the other protocol
  const alternateUrl = url.startsWith('https://') 
    ? url.replace('https://', 'http://')
    : url.replace('http://', 'https://');

  console.log('Trying alternate protocol:', alternateUrl);
  try {
    const response = await fetch(alternateUrl, { 
      headers,
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch website (status: ${response.status}). Tried both HTTP and HTTPS.`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Timeout after ${FETCH_TIMEOUT}ms fetching alternate protocol`);
    }
    throw error;
  }
}
