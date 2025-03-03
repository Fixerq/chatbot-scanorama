
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
  if (data.status === 'rate_limited' || data.error?.includes('rate limit') || data.status === 429) {
    const retryAfter = data.retryAfter || (retryCount + 1) * 10;
    console.log(`Rate limited, retrying after ${retryAfter}s...`);
    toast.error(`API rate limit reached. Retrying in ${retryAfter}s...`);
    return true; // Should retry
  }
  
  // Check for server errors
  if (data.status === 'server_error' || (data.status >= 500 && data.status < 600)) {
    console.log(`Server error, retrying with exponential backoff...`);
    return retryCount < maxRetries - 1; // Should retry for server errors
  }

  // Check for Google API specific errors
  if (data.error?.includes('Google Places API error')) {
    console.log('Google Places API error, checking if we should retry...');
    
    // For INVALID_ARGUMENT errors, no retry
    if (data.details?.includes('INVALID_ARGUMENT') || data.details?.includes('field mask')) {
      toast.error('Invalid search parameters.', {
        description: 'Please modify your search criteria and try again.',
        duration: 5000
      });
      return false;
    }
    
    // For other Google API errors, retry a few times
    return retryCount < maxRetries - 1;
  }
  
  // Handle 400 Bad Request errors specifically - check the payload format
  if (data.status === 'bad_request' || data.status === 400 || data.error?.includes('400')) {
    console.log('Bad request error, checking what went wrong...');
    
    // If it mentions field mask, this is a formatting issue with the API request
    if (data.details?.includes('field mask') || data.details?.includes('FieldMask')) {
      toast.error('API request formatting error.', {
        description: 'Please try again with different search terms.',
        duration: 5000
      });
      return false; // Specific error that we can't retry
    }
    
    // For other 400 errors, try a simplified request
    console.log('Retrying with simplified request payload');
    return retryCount < maxRetries - 1;
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
