
import { toast } from 'sonner';

export const handleSearchError = (error: any, retryCount: number, maxRetries: number): boolean => {
  console.error('Places search error:', error);
  
  // Log more detailed error information
  console.error('Error details:', {
    message: error.message,
    code: error.code,
    statusCode: error.status,
    response: error.response
  });

  // Check for rate limiting
  if (error.status === 429) {
    const retryAfter = error?.retryAfter || (retryCount + 1) * 10;
    console.log(`Rate limited, retrying after ${retryAfter}s...`);
    toast.error(`API rate limit reached. Retrying in ${retryAfter}s...`);
    return true; // Should retry
  }
  
  // Check for server errors
  if (error.status >= 500) {
    console.log(`Server error (${error.status}), retrying with exponential backoff...`);
    return retryCount < maxRetries - 1; // Should retry for server errors
  }

  // Check for authorization errors
  if (error.status === 401 || error.status === 403) {
    toast.error('API authorization error. Please check your API key.', { 
      description: 'Contact your administrator to resolve this issue.'
    });
    return false; // No retry for auth errors
  }

  // If we get a non-handled error, retry after a delay with exponential backoff
  if (retryCount < maxRetries - 1) {
    console.log(`Got error, retrying with exponential backoff... (attempt ${retryCount + 1} of ${maxRetries})`);
    return true; // Should retry
  }
  
  // All retries failed
  if (error.message?.includes('API key')) {
    toast.error('Google Places API key is missing or invalid. Please check your configuration.', { 
      description: 'Contact your administrator to resolve this issue.'
    });
  } else {
    toast.error('Search service is currently unavailable.', { 
      description: 'Please try again later or try a different search.',
      duration: 5000
    });
  }
  return false; // No more retries
};

export const handleDataError = (data: any, retryCount: number, maxRetries: number): boolean => {
  console.error('Places search API error:', data.error);
  console.error('Error details:', data.details || 'No details provided');
  
  // Check for rate limiting
  if (data.status === 'rate_limited' || data.error?.includes('rate limit')) {
    const retryAfter = data.retryAfter || (retryCount + 1) * 10;
    console.log(`Rate limited, retrying after ${retryAfter}s...`);
    toast.error(`API rate limit reached. Retrying in ${retryAfter}s...`);
    return true; // Should retry
  }
  
  // Check for server errors
  if (data.status === 'server_error') {
    console.log(`Server error, retrying with exponential backoff...`);
    return retryCount < maxRetries - 1; // Should retry for server errors
  }
  
  // If we have more retries left, try again with exponential backoff
  if (retryCount < maxRetries - 1) {
    console.log(`Got API error, retrying with exponential backoff... (attempt ${retryCount + 1} of ${maxRetries})`);
    return true; // Should retry
  }
  
  // All retries failed with API errors
  if (data.status === 'api_error' || data.error?.includes('API')) {
    toast.error('Error from Google Places API.', { 
      description: 'The search service is currently unavailable. Please try again later.',
      duration: 5000
    });
  } else if (data.status === 'config_error') {
    toast.error('Google Places API configuration error.', {
      description: 'Please contact support for assistance.',
      duration: 5000
    });
  } else {
    toast.error('Search service is currently unavailable.', { 
      description: 'Please try again later or modify your search.',
      duration: 5000
    });
  }
  return false; // No more retries
};
