
import { normalizeUrl } from '../utils/urlUtils.ts';

interface ProcessedUrl {
  cleanUrl: string;
  urlObj: URL;
}

export async function processUrl(url: string): Promise<ProcessedUrl> {
  // Skip problematic URLs
  if (url.includes('maps.google.com') || url.includes('google.com/maps')) {
    throw new Error('Google Maps URL skipped');
  }

  // Clean up the URL
  const cleanUrl = url.trim().replace(/\/$/, '');
  
  // Parse URL
  const urlObj = new URL(cleanUrl);
  
  // Add www. if not present and no subdomain exists
  if (!urlObj.hostname.includes('.') && !urlObj.hostname.startsWith('www.')) {
    urlObj.hostname = 'www.' + urlObj.hostname;
    console.log('Added www subdomain:', urlObj.toString());
  }
  
  // Normalize the URL
  const normalizedUrl = normalizeUrl(urlObj.toString());
  
  return {
    cleanUrl: normalizedUrl,
    urlObj: new URL(normalizedUrl)
  };
}
