
/**
 * Normalizes a URL by removing all query parameters and converting to lowercase
 */
export function normalizeUrl(url: string): string {
  try {
    if (!url?.trim()) {
      throw new Error('URL cannot be empty');
    }

    console.log('[URL Utils] Normalizing URL:', url);
    
    // Create URL object to parse the URL properly
    const urlObj = new URL(url);
    
    // Get root domain by removing www. prefix and any query parameters
    const rootDomain = urlObj.hostname.replace(/^www\./, '').toLowerCase();
    
    // Always use https as the protocol for consistency
    const normalized = `https://${rootDomain}`;
    
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
