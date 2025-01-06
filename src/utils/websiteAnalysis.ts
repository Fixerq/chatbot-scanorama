import { supabase } from '@/integrations/supabase/client';

function validateUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new Error('URL is required');
  }

  let normalizedUrl = url.trim();
  if (!normalizedUrl) {
    throw new Error('URL cannot be empty');
  }

  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  try {
    new URL(normalizedUrl);
    return normalizedUrl;
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