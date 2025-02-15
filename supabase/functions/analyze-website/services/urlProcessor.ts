import { normalizeUrl } from '../utils/urlUtils.ts';

interface ProcessedUrl {
  cleanUrl: string;
  urlObj: URL;
}

const BLOCKED_DOMAINS = [
  'google.com',
  'gmail.com',
  'youtube.com',
  'docs.google.com',
  'drive.google.com',
  'maps.google.com',
  'google.com/maps'
];

export async function processUrl(url: string): Promise<ProcessedUrl> {
  try {
    console.log('[URL Processor] Starting URL processing for:', url);
    
    // First, try to create a URL object to validate the URL
    let urlObj = new URL(url);
    console.log('[URL Processor] Valid URL object created');
    
    // Remove tracking parameters (utm_*, ref, fbclid, etc)
    const searchParams = new URLSearchParams(urlObj.search);
    const cleanParams = new URLSearchParams();
    
    // Keep only non-tracking parameters
    for (const [key, value] of searchParams.entries()) {
      if (!key.toLowerCase().startsWith('utm_') && 
          !key.toLowerCase().includes('fbclid') && 
          !key.toLowerCase().includes('ref')) {
        cleanParams.append(key, value);
      }
    }
    
    // Reconstruct the URL without tracking parameters
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    const cleanSearch = cleanParams.toString();
    const cleanUrl = cleanSearch ? `${baseUrl}?${cleanSearch}` : baseUrl;
    
    console.log('[URL Processor] Cleaned URL:', cleanUrl);
    
    // Get normalized URL to standardize it
    const normalizedUrl = normalizeUrl(cleanUrl);
    console.log('[URL Processor] Normalized URL:', normalizedUrl);
    
    // Create final URL object
    urlObj = new URL(normalizedUrl);
    
    // Check if the root domain exactly matches any blocked domain
    const rootDomain = urlObj.hostname.toLowerCase();
    if (BLOCKED_DOMAINS.includes(rootDomain)) {
      console.log('[URL Processor] Blocked domain detected:', rootDomain);
      throw new Error(`Domain ${rootDomain} cannot be analyzed`);
    }

    return {
      cleanUrl: normalizedUrl,
      urlObj: urlObj
    };
  } catch (error) {
    console.error('[URL Processor] Error processing URL:', error);
    throw error;
  }
}
