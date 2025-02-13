
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
    } catch (error) {
      console.log('HTTPS attempt failed:', error);
    }
  }

  // If original failed, try the other protocol
  const alternateUrl = url.startsWith('https://') 
    ? url.replace('https://', 'http://')
    : url.replace('http://', 'https://');

  console.log('Trying alternate protocol:', alternateUrl);
  const response = await fetch(alternateUrl, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
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
    
    // Fetch the website content with retry logic
    const response = await tryFetch(cleanUrl);
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
        websockets: hasWebSockets
      },
      lastChecked: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error analyzing website:', error);
    return {
      status: 'error',
      error: error.message,
      has_chatbot: false,
      chatSolutions: [],
      details: {},
      lastChecked: new Date().toISOString()
    };
  }
}

