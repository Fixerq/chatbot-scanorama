
import { ChatDetectionResult } from '../types.ts';
import { CHAT_PATTERNS } from '../patterns.ts';
import { detectDynamicLoading, detectChatElements, detectMetaTags, detectWebSockets } from '../utils/patternDetection.ts';

const FETCH_TIMEOUT = 10000; // 10 second timeout

async function tryFetch(url: string): Promise<Response> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

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

export async function websiteAnalyzer(url: string): Promise<ChatDetectionResult> {
  console.log('Analyzing website:', url);
  
  try {
    // Skip problematic URLs
    if (url.includes('maps.google.com') || url.includes('google.com/maps')) {
      return {
        status: 'skipped',
        has_chatbot: false,
        chatSolutions: [],
        details: {
          url,
          reason: 'Google Maps URL skipped'
        },
        lastChecked: new Date().toISOString()
      };
    }

    // Clean up the URL
    const cleanUrl = url.trim().replace(/\/$/, '');
    
    // Add www. if not present and no subdomain exists
    const urlObj = new URL(cleanUrl);
    if (!urlObj.hostname.includes('.') && !urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = 'www.' + urlObj.hostname;
      console.log('Added www subdomain:', urlObj.toString());
    }
    
    // Memory-efficient content processing
    console.log('Attempting to fetch:', urlObj.toString());
    const response = await tryFetch(urlObj.toString());
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let html = '';
    
    if (!reader) {
      throw new Error('Could not get response body reader');
    }

    // Read the response in chunks to avoid memory issues
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      
      // Stop if we've found enough evidence of chatbots
      if (html.length > 500000 || // Limit to first 500KB
          (detectChatElements(html) && detectMetaTags(html))) {
        break;
      }
    }
    
    reader.releaseLock();
    console.log('Successfully fetched and processed website content');

    // Detect chatbot presence using various methods
    const hasDynamicChat = detectDynamicLoading(html);
    const hasChatElements = detectChatElements(html);
    const hasMetaTags = detectMetaTags(html);
    const hasWebSockets = detectWebSockets(html);

    console.log('Analysis results:', {
      hasDynamicChat,
      hasChatElements,
      hasMetaTags,
      hasWebSockets
    });

    // Detect specific chat solutions
    const detectedSolutions: string[] = [];
    for (const [provider, patterns] of Object.entries(CHAT_PATTERNS)) {
      if (patterns.some(pattern => html.includes(pattern))) {
        detectedSolutions.push(provider);
      }
    }

    const has_chatbot = hasDynamicChat || hasChatElements || hasMetaTags || hasWebSockets || detectedSolutions.length > 0;

    console.log('Final analysis:', {
      has_chatbot,
      detectedSolutions
    });

    return {
      status: 'success',
      has_chatbot,
      chatSolutions: detectedSolutions,
      details: {
        dynamic_loading: hasDynamicChat,
        chat_elements: hasChatElements,
        meta_tags: hasMetaTags,
        websockets: hasWebSockets,
        url: cleanUrl
      },
      lastChecked: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error analyzing website:', error);
    
    // Return a more detailed error status
    return {
      status: 'error',
      error: error.message,
      has_chatbot: false,
      chatSolutions: [],
      details: {
        url: url,
        errorType: error.name,
        errorMessage: error.message
      },
      lastChecked: new Date().toISOString()
    };
  }
}
