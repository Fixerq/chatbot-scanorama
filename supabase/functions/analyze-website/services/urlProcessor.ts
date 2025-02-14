
import { normalizeUrl } from '../utils/urlUtils.ts';

interface ProcessedUrl {
  cleanUrl: string;
  urlObj: URL;
}

export async function processUrl(url: string): Promise<ProcessedUrl> {
  try {
    // Skip problematic URLs
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('maps.google.com') || 
        lowerUrl.includes('google.com/maps') ||
        lowerUrl.includes('www.google.com') ||
        lowerUrl.includes('google.com')) {
      console.log('Google domain detected, skipping analysis:', url);
      throw new Error('Google domains are not supported for analysis');
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
  } catch (error) {
    console.error('Error processing URL:', error);
    throw error;
  }
}
