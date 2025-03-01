/**
 * Utilities for HTTP requests and HTML fetching
 */

// Maximum redirect depth to follow
const MAX_REDIRECTS = 5;

// Default timeout for HTTP requests in milliseconds
const DEFAULT_TIMEOUT = 30000;

/**
 * Fetches HTML content from a URL, handling redirects and timeouts
 */
export async function fetchHtmlContent(
  url: string,
  options: { timeout?: number; redirectCount?: number } = {}
): Promise<string> {
  const { timeout = DEFAULT_TIMEOUT, redirectCount = 0 } = options;

  if (redirectCount > MAX_REDIRECTS) {
    throw new Error(`Maximum redirect count (${MAX_REDIRECTS}) exceeded`);
  }

  try {
    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Perform the HTTP request
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      redirect: 'manual',
      signal: controller.signal,
    });

    // Clear the timeout regardless of outcome
    clearTimeout(timeoutId);

    // Handle redirects manually to keep track of redirect count
    if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.get('Location');
      if (!redirectUrl) {
        throw new Error(`Redirect status ${response.status} but no Location header`);
      }

      // Construct absolute URL if the redirect URL is relative
      const absoluteRedirectUrl = new URL(redirectUrl, url).toString();
      return fetchHtmlContent(absoluteRedirectUrl, {
        timeout,
        redirectCount: redirectCount + 1,
      });
    }

    // Check for successful response
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Check content type
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      console.warn(`Warning: Content type is ${contentType}, not HTML`);
    }

    // Get the text content
    return await response.text();
  } catch (error) {
    // Format and rethrow the error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Makes a HEAD request to check if a URL is accessible without downloading content
 */
export async function checkUrlAccess(url: string, timeout = 10000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}
