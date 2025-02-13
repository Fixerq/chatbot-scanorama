
import { ChatDetectionResult } from '../types.ts';
import { CHAT_PATTERNS } from '../patterns.ts';
import { detectDynamicLoading, detectChatElements, detectMetaTags, detectWebSockets } from '../utils/patternDetection.ts';

async function tryFetch(url: string): Promise<Response> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  // Try the original URL first
  try {
    const response = await fetch(url, { headers });
    if (response.ok) return response;
    
    console.log(`Initial fetch failed for ${url} with status ${response.status}`);
    
    // If the response is a redirect, follow it
    if (response.status === 301 || response.status === 302) {
      const redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        console.log(`Following redirect to ${redirectUrl}`);
        const redirectResponse = await fetch(redirectUrl, { headers });
        if (redirectResponse.ok) return redirectResponse;
      }
    }
  } catch (error) {
    console.log(`Failed to fetch ${url}:`, error);
  }

  // If http://, try https://
  if (url.startsWith('http://')) {
    try {
      const httpsUrl = url.replace('http://', 'https://');
      console.log('Trying HTTPS version:', httpsUrl);
      const response = await fetch(httpsUrl, { headers });
      if (response.ok) return response;
      
      console.log(`HTTPS attempt failed with status ${response.status}`);
    } catch (error) {
      console.log('HTTPS attempt failed:', error);
    }
  }

  // If still not successful, try the other protocol
  const alternateUrl = url.startsWith('https://') 
    ? url.replace('https://', 'http://')
    : url.replace('http://', 'https://');

  console.log('Trying alternate protocol:', alternateUrl);
  const response = await fetch(alternateUrl, { headers });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch website (status: ${response.status}). Tried both HTTP and HTTPS.`);
  }
  
  return response;
}

export async function websiteAnalyzer(url: string): Promise<ChatDetectionResult> {
  console.log('Analyzing website:', url);
  
  try {
    // Skip Google Maps URLs as they require authentication
    if (url.includes('maps.google.com')) {
      return {
        status: 'skipped',
        has_chatbot: false,
        chatSolutions: [],
        details: {},
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
    
    // Fetch the website content with retry logic
    console.log('Attempting to fetch:', urlObj.toString());
    const response = await tryFetch(urlObj.toString());
    const html = await response.text();
    console.log('Successfully fetched website content');

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
