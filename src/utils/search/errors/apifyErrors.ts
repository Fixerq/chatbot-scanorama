import { toast } from 'sonner';

export const handleApifyApiError = (error: any): void => {
  console.error('Apify search error:', error);
  
  if (error.message?.includes('API key')) {
    toast.error('Apify API key is missing or invalid.', { 
      description: 'Contact your administrator to resolve this issue.'
    });
    return;
  }
  
  if (error.status === 'api_error') {
    toast.error('Error from Apify API.', { 
      description: 'Please check your search terms and try again with a more specific location.'
    });
    return;
  }
  
  toast.error('Search service encountered an error.', { 
    description: 'Please try again later or modify your search.'
  });
};