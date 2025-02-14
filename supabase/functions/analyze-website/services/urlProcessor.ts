
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
  'drive.google.com'
];

export async function processUrl(url: string): Promise<ProcessedUrl> {
  try {
    // Normalize and clean the URL first
    const cleanUrl = url.trim().replace(/\/$/, '');
    if (!cleanUrl) {
      throw new Error('URL cannot be empty');
    }

    // Create URL object (will throw if invalid)
    const urlObj = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
    const hostname = urlObj.hostname.toLowerCase();

    // Check for blocked domains
    if (BLOCKED_DOMAINS.some(domain => hostname.includes(domain))) {
      console.log('[URL Processor] Blocked domain detected:', hostname);
      throw new Error('This domain cannot be analyzed');
    }

    // Clean up the URL
    const normalizedUrl = normalizeUrl(urlObj.toString());
    console.log('[URL Processor] Normalized URL:', normalizedUrl);
    
    return {
      cleanUrl: normalizedUrl,
      urlObj: new URL(normalizedUrl)
    };
  } catch (error) {
    console.error('[URL Processor] Error processing URL:', error);
    throw error;
  }
}
