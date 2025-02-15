
/**
 * Normalizes a URL by removing trailing slashes and converting to lowercase
 */
export function normalizeUrl(url: string): string {
  try {
    // Create URL object to parse the URL properly
    const urlObj = new URL(url);
    
    // Construct base URL
    let normalized = `${urlObj.protocol}//${urlObj.hostname.toLowerCase()}`;
    
    // Add port if it's non-standard
    if (urlObj.port && 
        !((urlObj.protocol === 'http:' && urlObj.port === '80') || 
          (urlObj.protocol === 'https:' && urlObj.port === '443'))) {
      normalized += `:${urlObj.port}`;
    }
    
    // Add path, removing trailing slashes except for root path
    if (urlObj.pathname === '/') {
      normalized += '/';
    } else {
      normalized += urlObj.pathname.replace(/\/+$/, '');
    }
    
    // Add search params if they exist
    if (urlObj.search) {
      normalized += urlObj.search;
    }
    
    console.log('[URL Utils] Normalized URL:', normalized);
    return normalized;
  } catch (error) {
    // If URL parsing fails, try prepending https:// and retry
    if (!url.match(/^https?:\/\//i)) {
      console.log('[URL Utils] Trying to add https:// prefix');
      return normalizeUrl(`https://${url}`);
    }
    console.error('[URL Utils] Error normalizing URL:', error);
    throw new Error(`Invalid URL: ${error.message}`);
  }
}

