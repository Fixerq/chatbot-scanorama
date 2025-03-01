
// Normalize URL by adding protocol if missing
export function normalizeUrl(url: string): string {
  if (!url) return '';
  url = url.trim();
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

// Extract domain from URL
export function extractDomain(url: string): string {
  try {
    const normalizedUrl = normalizeUrl(url);
    const urlObj = new URL(normalizedUrl);
    return urlObj.hostname;
  } catch (error) {
    console.error('Error extracting domain:', error);
    return '';
  }
}

// Check if URL is valid
export function isValidUrl(url: string): boolean {
  try {
    const normalizedUrl = normalizeUrl(url);
    new URL(normalizedUrl);
    return true;
  } catch (error) {
    return false;
  }
}

// Sanitize URL to prevent common issues
export function sanitizeUrl(url: string): string {
  // Normalize the URL first
  let sanitized = normalizeUrl(url);
  
  try {
    // Parse URL to work with its components
    const urlObj = new URL(sanitized);
    
    // Remove any fragments
    urlObj.hash = '';
    
    // Ensure no sensitive or tracking parameters
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
    const params = new URLSearchParams(urlObj.search);
    paramsToRemove.forEach(param => {
      params.delete(param);
    });
    
    // Update the URL search part
    urlObj.search = params.toString();
    
    return urlObj.toString();
  } catch (error) {
    console.error('Error sanitizing URL:', error);
    return sanitized;
  }
}
