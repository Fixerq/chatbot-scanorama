
export function normalizeUrl(url: string): string {
  try {
    // Remove any trailing colons and slashes
    let cleanUrl = url.trim().replace(/[:\/]+$/, '');
    
    // Add https:// if no protocol is specified
    if (!cleanUrl.match(/^https?:\/\//i)) {
      cleanUrl = `https://${cleanUrl}`;
    }
    
    // Parse URL to normalize it
    const urlObj = new URL(cleanUrl);
    
    // Remove any extra colons from hostname
    urlObj.hostname = urlObj.hostname.replace(/:/g, '');
    
    // Remove www. prefix
    urlObj.hostname = urlObj.hostname.replace(/^www\./, '');
    
    // Remove query parameters and hash
    urlObj.search = '';
    urlObj.hash = '';
    
    // Remove path
    urlObj.pathname = '/';
    
    // Clean up double slashes (except after protocol)
    let finalUrl = urlObj.toString().replace(/([^:]\/)\/+/g, '$1');
    
    console.log('[URL Utils] Original URL:', url);
    console.log('[URL Utils] Normalized URL:', finalUrl);
    return finalUrl;
  } catch (error) {
    console.error('[URL Utils] URL normalization error:', error);
    throw new Error('Invalid URL format');
  }
}
