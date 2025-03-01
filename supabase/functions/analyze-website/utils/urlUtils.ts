
/**
 * Utilities for URL manipulation and validation
 */

/**
 * Normalizes a URL by ensuring it has a proper protocol
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';
  
  url = url.trim();
  
  // Remove any trailing slash
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  // If the URL doesn't start with a protocol, add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  return url;
}

/**
 * Checks if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Sanitizes a URL by removing unwanted parameters and fragments
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    
    // Remove tracking parameters
    const paramsToRemove = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', 'ref', 'source', 'mc_cid', 'mc_eid',
    ];
    
    paramsToRemove.forEach(param => {
      parsed.searchParams.delete(param);
    });
    
    // Remove hash fragment (if any)
    parsed.hash = '';
    
    return parsed.toString();
  } catch (error) {
    // If parsing fails, return the original URL
    return url;
  }
}

/**
 * Extracts the domain name from a URL
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch (error) {
    // If parsing fails, attempt a simple extraction
    const match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/i);
    return match ? match[1] : '';
  }
}

/**
 * Extracts base URL without path, query parameters, or hash
 */
export function getBaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch (error) {
    return url;
  }
}
