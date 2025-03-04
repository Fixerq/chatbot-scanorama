
/**
 * Utilities for fetching and processing HTTP content
 */

/**
 * Fetches HTML content with options for timeout and retry
 */
export async function fetchHtmlContent(
  url: string,
  options: {
    timeout?: number;
    retries?: number;
    userAgent?: string;
  } = {}
): Promise<string> {
  const {
    timeout = 30000,
    retries = 1,
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  } = options;

  // Controller for timeout abort
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    // Create fetch options
    const fetchOptions = {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
      redirect: 'follow'
    };
    
    // Try to fetch with retries if needed
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt + 1} for ${url}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }
        
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Check content type to make sure it's HTML
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
          console.warn(`Non-HTML content type: ${contentType} for ${url}`);
        }
        
        // Get the HTML content
        const html = await response.text();
        return html;
      } catch (error) {
        console.error(`Fetch attempt ${attempt + 1} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
    
    // If we get here, all retry attempts failed
    throw lastError || new Error(`Failed to fetch ${url} after ${retries} attempts`);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extracts information from HTTP headers
 */
export function extractHeaderInfo(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  
  headers.forEach((value, key) => {
    // Normalize header keys to lowercase
    result[key.toLowerCase()] = value;
  });
  
  return result;
}
