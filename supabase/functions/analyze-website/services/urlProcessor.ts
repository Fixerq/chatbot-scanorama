import { normalizeUrl } from '../utils/urlUtils.ts';

interface ProcessedUrl {
  cleanUrl: string;
  urlObj: URL;
}

const BLOCKED_DOMAINS = [
  'google.com',
  'google.',
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
    
    // Normalize and clean the URL first
    const cleanUrl = url.trim().replace(/\/$/, '');
    if (!cleanUrl) {
      console.error('[URL Processor] Empty URL provided');
      throw new Error('URL cannot be empty');
    }

    // Create URL object (will throw if invalid)
    console.log('[URL Processor] Attempting to create URL object for:', cleanUrl);
    const urlObj = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
    
    // Important: We keep the original hostname and don't modify it
    const normalizedUrl = normalizeUrl(urlObj.toString());
    console.log('[URL Processor] Normalized URL:', normalizedUrl);
    
    // Don't block the actual business URLs, only block if they are direct Google domain URLs
    if (BLOCKED_DOMAINS.some(domain => urlObj.hostname === domain)) {
      console.log('[URL Processor] Blocked domain detected:', urlObj.hostname);
      throw new Error(`Domain ${urlObj.hostname} cannot be analyzed`);
    }

    return {
      cleanUrl: normalizedUrl,
      urlObj: new URL(normalizedUrl)
    };
  } catch (error) {
    console.error('[URL Processor] Error processing URL:', error);
    throw error;
  }
}
