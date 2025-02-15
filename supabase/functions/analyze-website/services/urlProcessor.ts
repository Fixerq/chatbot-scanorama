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
    
    // Extract root domain by removing www. prefix and keeping only hostname
    const rootDomain = urlObj.hostname.replace(/^www\./, '');
    console.log('[URL Processor] Extracted root domain:', rootDomain);

    // Reconstruct the URL with only the root domain
    const cleanUrl = `${urlObj.protocol}//${rootDomain}`;
    console.log('[URL Processor] Using root domain URL:', cleanUrl);

    // Check blocked domains
    const normalizedRootDomain = rootDomain.toLowerCase();
    if (BLOCKED_DOMAINS.includes(normalizedRootDomain)) {
      console.log('[URL Processor] Blocked domain detected:', normalizedRootDomain);
      throw new Error(`Domain ${normalizedRootDomain} cannot be analyzed`);
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
