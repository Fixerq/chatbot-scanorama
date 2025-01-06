import { supabase } from '@/integrations/supabase/client';

function validateUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new Error('URL is required');
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    throw new Error('URL cannot be empty');
  }

  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    trimmedUrl = `https://${trimmedUrl}`;
  }

  try {
    new URL(trimmedUrl);
    return trimmedUrl;
  } catch {
    throw new Error('Invalid URL format');
  }
}

export const analyzeWebsite = async (url: string) => {
  try {
    if (!url) {
      console.error('No URL provided');
      throw new Error('URL is required');
    }

    // Validate URL before proceeding
    const validatedUrl = validateUrl(url);
    console.log('Processing URL:', validatedUrl);

    return {
      status: 'Success',
      details: {
        lastChecked: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Error processing website:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      status: 'Error',
      details: { 
        errorDetails: errorMessage,
        lastChecked: new Date().toISOString()
      }
    };
  }
};