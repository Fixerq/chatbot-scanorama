
import { normalizeUrl } from '../utils/urlUtils.ts';

interface ProcessedUrl {
  cleanUrl: string;
  urlObj: URL;
}

export async function processUrl(url: string): Promise<ProcessedUrl> {
  // Skip problematic URLs
  if (url.toLowerCase().includes('maps.google.com') || 
      url.toLowerCase().includes('google.com/maps') ||
      url.toLowerCase().includes('www.google.com/maps')) {
    console.log('Google Maps URL detected, skipping analysis:', url);
    throw new Error('Google Maps URLs are not supported for analysis');
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
  
  console.log('Processed URL:', normalizedUrl);
  
  return {
    cleanUrl: normalizedUrl,
    urlObj: new URL(normalizedUrl)
  };
}

