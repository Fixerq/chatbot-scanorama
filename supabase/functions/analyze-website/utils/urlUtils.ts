
/**
 * Validates if a string is a properly formatted URL
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * Normalizes a URL string by ensuring it has a proper protocol
 */
export function normalizeUrl(urlString: string): string {
  if (!urlString) return '';
  
  urlString = urlString.trim();
  
  // If the URL doesn't start with http:// or https://, add https://
  if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
    urlString = 'https://' + urlString;
  }
  
  return urlString;
}

/**
 * Sanitizes a URL to prevent security issues
 */
export function sanitizeUrl(urlString: string): string {
  // Only allow http and https protocols
  const url = new URL(urlString);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Invalid URL protocol');
  }
  
  // Remove any fragments as they're not needed for analysis
  url.hash = '';
  
  return url.toString();
}

/**
 * Extracts the domain from a URL
 */
export function extractDomain(urlString: string): string {
  try {
    const url = new URL(normalizeUrl(urlString));
    return url.hostname;
  } catch (e) {
    return '';
  }
}

/**
 * Builds a full URL from a potentially relative URL and a base URL
 */
export function resolveRelativeUrl(baseUrl: string, relativeUrl: string): string {
  try {
    const base = new URL(baseUrl);
    const resolved = new URL(relativeUrl, base);
    return resolved.toString();
  } catch (e) {
    return relativeUrl;
  }
}
