export class FirecrawlError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'FirecrawlError';
  }
}

export const handleFirecrawlError = (error: any): string => {
  const errorStr = error?.toString().toLowerCase() || '';
  console.log('Detailed Firecrawl error:', error);
  
  // Network errors
  if (errorStr.includes('timeout') || errorStr.includes('econnrefused')) {
    return 'Website is not responding';
  }
  if (errorStr.includes('network') || errorStr.includes('connection')) {
    return 'Network connection error';
  }
  
  // HTTP errors
  if (errorStr.includes('403')) {
    return 'Access denied by website';
  }
  if (errorStr.includes('404')) {
    return 'Website not found';
  }
  if (errorStr.includes('429')) {
    return 'Rate limit exceeded';
  }
  if (errorStr.includes('500') || errorStr.includes('502') || errorStr.includes('503')) {
    return 'Website server error';
  }
  
  // Security errors
  if (errorStr.includes('ssl') || errorStr.includes('certificate')) {
    return 'SSL/Security certificate issue';
  }
  if (errorStr.includes('robots.txt') || errorStr.includes('forbidden')) {
    return 'Website blocks automated access';
  }
  
  // API errors
  if (errorStr.includes('api key') || errorStr.includes('authentication')) {
    return 'API authentication error';
  }
  if (errorStr.includes('rate limit')) {
    return 'Rate limit exceeded';
  }
  
  // Content errors
  if (errorStr.includes('parse') || errorStr.includes('invalid html')) {
    return 'Unable to parse website content';
  }
  if (errorStr.includes('empty') || errorStr.includes('no content')) {
    return 'Website returned no content';
  }
  
  return 'Website not accessible - ' + (errorStr.slice(0, 100) || 'unknown error');
};