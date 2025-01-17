import { CHAT_PATTERNS } from './patterns.ts';

// Rotate between different user agents to reduce blocking
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

async function fetchWithRetry(url: string, maxRetries = 2): Promise<Response> {
  const getHeaders = (attempt: number) => ({
    'User-Agent': USER_AGENTS[attempt % USER_AGENTS.length],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
  });

  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1} for URL: ${url}`);
      const response = await fetch(url, { 
        headers: getHeaders(i),
        redirect: 'follow'
      });

      if (response.ok) return response;
      
      if (response.status === 404) {
        throw new Error('Page not found');
      }
      
      if (response.status === 403 || response.status === 401) {
        if (i === maxRetries - 1) {
          throw new Error('Website blocks automated access');
        }
        console.log('Access denied, retrying with different user agent...');
        continue;
      }
      
      lastError = new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      lastError = error;
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000;
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

function normalizeUrl(url: string): string {
  try {
    // Remove any trailing colons and slashes
    let cleanUrl = url.trim().replace(/[:\/]+$/, '');
    
    // Add https:// if no protocol is specified
    if (!cleanUrl.match(/^https?:\/\//i)) {
      cleanUrl = `https://${cleanUrl}`;
    }
    
    // Parse URL to normalize it
    const urlObj = new URL(cleanUrl);
    
    // Remove any extra colons from hostname
    urlObj.hostname = urlObj.hostname.replace(/:/g, '');
    
    // Remove hash
    urlObj.hash = '';
    
    // Clean up double slashes (except after protocol)
    let finalUrl = urlObj.toString().replace(/([^:]\/)\/+/g, '$1');
    
    console.log('Normalized URL:', finalUrl);
    return finalUrl;
  } catch (error) {
    console.error('URL normalization error:', error);
    throw new Error('Invalid URL format');
  }
}

export async function analyzeChatbot(url: string): Promise<string[]> {
  console.log('Analyzing URL:', url);
  
  try {
    const normalizedUrl = normalizeUrl(url);
    console.log('Normalized URL:', normalizedUrl);
    
    const response = await fetchWithRetry(normalizedUrl);
    const html = await response.text();
    console.log('Successfully fetched HTML content');
    
    const detectedChatSolutions: string[] = [];

    // Check for specific chat solutions
    for (const [solution, patterns] of Object.entries(CHAT_PATTERNS)) {
      if (patterns.some(pattern => {
        const matches = pattern.test(html);
        if (matches) {
          console.log(`Detected ${solution} using pattern:`, pattern);
        }
        return matches;
      })) {
        if (!detectedChatSolutions.includes(solution)) {
          detectedChatSolutions.push(solution);
        }
      }
    }

    // Check for dynamic loading patterns
    const dynamicPatterns = [
      /window\.(onload|addEventListener).*chat/i,
      /document\.(ready|addEventListener).*chat/i,
      /loadChat|initChat|startChat|chatInit/i,
      /chat.*widget.*load/i,
      /load.*chat.*widget/i,
      /init.*chat.*widget/i,
      /chat.*messenger.*load/i,
      /load.*chat.*messenger/i,
      /init.*chat.*messenger/i,
      /chat.*bot.*load/i,
      /load.*chat.*bot/i,
      /init.*chat.*bot/i
    ];
    
    if (dynamicPatterns.some(pattern => pattern.test(html)) && !detectedChatSolutions.includes('Custom Chat')) {
      console.log('Detected dynamically loaded chat widget');
      detectedChatSolutions.push('Custom Chat');
    }

    // Check for common chat-related elements
    const elementPatterns = [
      /<div[^>]*(?:chat|messenger|support|bot)[^>]*>/i,
      /<iframe[^>]*(?:chat|messenger|support|bot)[^>]*>/i,
      /<button[^>]*(?:chat|messenger|support|bot)[^>]*>/i,
      /<script[^>]*(?:chat|messenger|support|bot)[^>]*>/i,
      /<link[^>]*(?:chat|messenger|support|bot)[^>]*>/i
    ];

    if (elementPatterns.some(pattern => pattern.test(html)) && !detectedChatSolutions.includes('Custom Chat')) {
      console.log('Detected common chat elements');
      detectedChatSolutions.push('Custom Chat');
    }

    // Check for chat-related meta tags and configurations
    const metaPatterns = [
      /<meta[^>]*(?:chat|messenger|support|bot)[^>]*>/i,
      /chat.*config/i,
      /messenger.*config/i,
      /bot.*config/i,
      /chatbot.*config/i,
      /chat.*settings/i,
      /messenger.*settings/i,
      /bot.*settings/i
    ];

    if (metaPatterns.some(pattern => pattern.test(html)) && !detectedChatSolutions.includes('Custom Chat')) {
      console.log('Detected chat-related meta tags or configurations');
      detectedChatSolutions.push('Custom Chat');
    }

    // Check for WebSocket connections related to chat
    const wsPatterns = [
      /new WebSocket.*chat/i,
      /WebSocket.*messenger/i,
      /ws.*chat/i,
      /wss.*chat/i,
      /socket.*chat/i,
      /chat.*socket/i
    ];

    if (wsPatterns.some(pattern => pattern.test(html)) && !detectedChatSolutions.includes('Custom Chat')) {
      console.log('Detected WebSocket-based chat');
      detectedChatSolutions.push('Custom Chat');
    }

    console.log('Analysis complete. Detected solutions:', detectedChatSolutions);
    return detectedChatSolutions;
  } catch (error) {
    console.error('Error analyzing website:', error);
    throw error;
  }
}