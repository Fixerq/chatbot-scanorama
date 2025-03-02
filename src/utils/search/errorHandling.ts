
import { toast } from 'sonner';

export const handleSearchError = (error: any, retryCount: number, maxRetries: number): boolean => {
  console.error('Places search error:', error);
  
  // Log more detailed error information
  console.error('Error details:', {
    message: error.message,
    code: error.code,
    statusCode: error.status
  });

  // Check for rate limiting
  if (error.status === 429) {
    const retryAfter = error?.retryAfter || (retryCount + 1) * 10;
    console.log(`Rate limited, retrying after ${retryAfter}s...`);
    toast.error(`API rate limit reached. Retrying in ${retryAfter}s...`);
    return true; // Should retry
  }

  // If we get a non-200 error, retry after a delay with exponential backoff
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
      description: 'Please try again later or try a different search.'
    });
  }
  return false; // No more retries
};

export const handleDataError = (data: any, retryCount: number, maxRetries: number): boolean => {
  console.error('Places search API error:', data.error);
  console.error('Error details:', data.details || 'No details provided');
  
  // Check for rate limiting
  if (data.status === 'rate_limited') {
    const retryAfter = data.retryAfter || (retryCount + 1) * 10;
    console.log(`Rate limited, retrying after ${retryAfter}s...`);
    toast.error(`API rate limit reached. Retrying in ${retryAfter}s...`);
    return true; // Should retry
  }
  
  // If we have more retries left, try again with exponential backoff
  if (retryCount < maxRetries - 1) {
    console.log(`Got API error, retrying with exponential backoff... (attempt ${retryCount + 1} of ${maxRetries})`);
    return true; // Should retry
  }
  
  // All retries failed with API errors
  if (data.status === 'api_error') {
    toast.error('Error from Google Places API.', { 
      description: 'Please check your search terms and try again with a more specific location.'
    });
  } else if (data.status === 'config_error') {
    toast.error('Google Places API configuration error.', {
      description: 'Please ensure your API key is set up correctly in the Supabase Edge Function settings.'
    });
  } else {
    toast.error('Search service encountered an error.', { 
      description: 'Please try again later or modify your search.'
    });
  }
  return false; // No more retries
};
