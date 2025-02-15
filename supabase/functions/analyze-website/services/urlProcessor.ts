
import { normalizeUrl } from '../utils/urlUtils.ts';

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

    // First normalize the URL to remove query parameters and ensure consistent format
    const cleanUrl = normalizeUrl(url);
    console.log('[URL Processor] Normalized URL:', cleanUrl);
    
    // Create URL object from the cleaned URL
    const urlObj = new URL(cleanUrl);
    
    // Extract root domain for blocked domain check
    const rootDomain = urlObj.hostname.toLowerCase();
    
    if (BLOCKED_DOMAINS.includes(rootDomain)) {
      console.log('[URL Processor] Blocked domain detected:', rootDomain);
      throw new Error(`Domain ${rootDomain} cannot be analyzed`);
    }

    return {
      cleanUrl,
      urlObj
    };
  } catch (error) {
    console.error('[URL Processor] Error processing URL:', error);
    throw error;
  }
}
