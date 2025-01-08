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

      // Return successful responses
      if (response.ok) return response;
      
      // Don't retry on permanent errors
      if (response.status === 404) {
        throw new Error('Page not found');
      }
      
      // For 403/401, try with different user agent
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
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, i) * 1000;
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

function normalizeUrl(url: string): string {
  try {
    // Remove any hash fragments and trailing slashes
    const urlObj = new URL(url);
    urlObj.hash = '';
    return urlObj.toString().replace(/\/$/, '');
  } catch {
    // If URL parsing fails, try adding https://
    try {
      const urlWithHttps = new URL(`https://${url}`);
      urlWithHttps.hash = '';
      return urlWithHttps.toString().replace(/\/$/, '');
    } catch {
      throw new Error('Invalid URL format');
    }
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
        detectedChatSolutions.push(solution);
      }
    }

    // Check for dynamic loading patterns
    const hasDynamicChatLoading = /window\.(onload|addEventListener).*chat/i.test(html) ||
                                 /document\.(ready|addEventListener).*chat/i.test(html) ||
                                 /loadChat|initChat|startChat|chatInit/i.test(html);
    
    if (hasDynamicChatLoading && !detectedChatSolutions.includes('Custom Chat')) {
      console.log('Detected dynamically loaded chat widget');
      detectedChatSolutions.push('Custom Chat');
    }

    // Additional checks for common chat-related elements
    const hasCommonChatElements = /<div[^>]*(?:chat|messenger|support)[^>]*>/.test(html) ||
                                 /<iframe[^>]*(?:chat|messenger|support)[^>]*>/.test(html) ||
                                 /<button[^>]*(?:chat|messenger|support)[^>]*>/.test(html);

    if (hasCommonChatElements && !detectedChatSolutions.includes('Custom Chat')) {
      console.log('Detected common chat elements');
      detectedChatSolutions.push('Custom Chat');
    }

    return detectedChatSolutions;
  } catch (error) {
    console.error('Error analyzing website:', error);
    throw error;
  }
}