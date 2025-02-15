
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
    
    // Get normalized URL first to clean it up
    const normalizedUrl = normalizeUrl(url);
    console.log('[URL Processor] Normalized URL:', normalizedUrl);
    
    // Create URL object from normalized URL
    const urlObj = new URL(normalizedUrl);
    
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
