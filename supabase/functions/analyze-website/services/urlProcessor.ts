
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
    const initialCleanUrl = cleanSearch ? `${baseUrl}?${cleanSearch}` : baseUrl;
    
    console.log('[URL Processor] Initial cleaned URL:', initialCleanUrl);
    
    // Get normalized URL to standardize it
    const normalizedUrl = normalizeUrl(initialCleanUrl);
    console.log('[URL Processor] Normalized URL:', normalizedUrl);
    
    // Create final URL object from normalized URL
    const finalUrlObj = new URL(normalizedUrl);
    
    // Check if the root domain exactly matches any blocked domain
    const rootDomain = finalUrlObj.hostname.toLowerCase();
    if (BLOCKED_DOMAINS.includes(rootDomain)) {
      console.log('[URL Processor] Blocked domain detected:', rootDomain);
      throw new Error(`Domain ${rootDomain} cannot be analyzed`);
    }

    return {
      cleanUrl: normalizedUrl,
      urlObj: finalUrlObj
    };
  } catch (error) {
    console.error('[URL Processor] Error processing URL:', error);
    throw error;
  }
}
