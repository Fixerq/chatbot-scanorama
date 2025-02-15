
const BLOCKED_DOMAINS = [
  'google.com',
  'gmail.com',
  'youtube.com',
  'docs.google.com',
  'drive.google.com',
  'maps.google.com',
  'google.com/maps'
];

export async function processUrl(url: string): Promise<{ cleanUrl: string; urlObj: URL }> {
  try {
    console.log('[URL Processor] Starting URL processing for:', url);
    
    if (!url?.trim()) {
      throw new Error('URL cannot be empty');
    }

    // First, try to create a URL object to validate the URL
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch {
      // If URL parsing fails, try prepending https:// and retry
      if (!url.match(/^https?:\/\//i)) {
        console.log('[URL Processor] Adding https:// prefix to URL');
        urlObj = new URL(`https://${url}`);
      } else {
        throw new Error('Invalid URL format');
      }
    }
    
    console.log('[URL Processor] Valid URL object created:', urlObj.toString());
    
    // Remove tracking parameters
    const searchParams = new URLSearchParams(urlObj.search);
    const cleanParams = new URLSearchParams();
    
    for (const [key, value] of searchParams.entries()) {
      if (!key.toLowerCase().startsWith('utm_') && 
          !key.toLowerCase().includes('fbclid') && 
          !key.toLowerCase().includes('ref')) {
        cleanParams.append(key, value);
      }
    }
    
    // Reconstruct the URL
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    const cleanSearch = cleanParams.toString();
    const cleanUrl = cleanSearch ? `${baseUrl}?${cleanSearch}` : baseUrl;
    
    console.log('[URL Processor] Cleaned URL:', cleanUrl);

    // Check blocked domains
    const rootDomain = urlObj.hostname.toLowerCase();
    if (BLOCKED_DOMAINS.includes(rootDomain)) {
      console.log('[URL Processor] Blocked domain detected:', rootDomain);
      throw new Error(`Domain ${rootDomain} cannot be analyzed`);
    }

    return {
      cleanUrl,
      urlObj: new URL(cleanUrl)
    };
  } catch (error) {
    console.error('[URL Processor] Error processing URL:', error);
    throw error;
  }
}
