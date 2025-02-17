
export function isValidBusinessUrl(url: string): boolean {
  // Skip Google Maps URLs and other non-business URLs
  if (url.includes('google.com/maps') || url.includes('maps.google.com')) {
    return false;
  }
  
  // Basic URL validation
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function extractWebsiteUrl(result: any): string | null {
  // If we have a website_url in the details, use that
  if (result.details?.website_url) {
    return result.details.website_url;
  }
  
  // If the URL is already a valid business URL, use it
  if (isValidBusinessUrl(result.url)) {
    return result.url;
  }
  
  return null;
}

export function extractValidUrls(results: any[]): string[] {
  return results
    .map(result => extractWebsiteUrl(result))
    .filter((url): url is string => url !== null);
}
