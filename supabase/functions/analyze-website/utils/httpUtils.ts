
interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
}

// Fetch with timeout to avoid hanging requests
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Add user-agent and other necessary headers
export function getRequestHeaders(): HeadersInit {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };
}

// Safely fetch HTML content with error handling and timeout
export async function fetchHtmlContent(url: string): Promise<string> {
  try {
    const response = await fetchWithTimeout(url, {
      headers: getRequestHeaders(),
      timeout: 30000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}
