
/**
 * Utilities for URL handling and normalization
 */

// Normalize URL for consistent processing
export const normalizeUrl = (url: string): string => {
  try {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    
    const urlObj = new URL(url);
    
    // Remove trailing slash
    let hostname = urlObj.hostname;
    let pathname = urlObj.pathname;
    
    // Remove www if present for consistency
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    // Remove trailing slash from pathname if it's just a slash
    if (pathname === '/') {
      pathname = '';
    }
    
    // Reconstruct URL with normalized hostname and pathname
    return `${urlObj.protocol}//${hostname}${pathname}${urlObj.search}`;
  } catch (error) {
    console.error(`Error normalizing URL ${url}:`, error);
    return url; // Return original URL if normalization fails
  }
};

// Extract domain from URL
export const extractDomain = (url: string): string => {
  try {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error(`Error extracting domain from URL ${url}:`, error);
    return url; // Return original URL if extraction fails
  }
};

// Check if URL is valid
export const isValidUrl = (url: string): boolean => {
  try {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};
