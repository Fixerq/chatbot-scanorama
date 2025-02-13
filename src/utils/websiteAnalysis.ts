
import { supabase } from '@/integrations/supabase/client';

interface WebsiteAnalysisResult {
  status: string;
  details: {
    lastChecked: string;
    errorDetails?: string;
    chatSolutions?: string[];
  };
}

function validateUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new Error('URL is required');
  }

  let trimmedUrl = url.trim();
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

export const analyzeWebsite = async (url: string): Promise<WebsiteAnalysisResult> => {
  try {
    if (!url) {
      console.error('No URL provided');
      throw new Error('URL is required');
    }

    // Validate URL before proceeding
    const validatedUrl = validateUrl(url);
    console.log('Processing URL:', validatedUrl);

    // First check cache
    const { data: cachedResult } = await supabase
      .from('chatbot_detections')
      .select('*')
      .eq('website_url', validatedUrl)
      .maybeSingle();

    if (cachedResult) {
      console.log('Found cached result for:', validatedUrl);
      return {
        status: 'Success',
        details: {
          lastChecked: cachedResult.last_checked,
          chatSolutions: cachedResult.chatbot_providers || [],
        }
      };
    }

    // If no cached result, queue for analysis
    const { data: queueItem, error: queueError } = await supabase
      .from('website_analysis_queue')
      .insert([{
        website_url: validatedUrl,
        status: 'pending'
      }])
      .select()
      .single();

    if (queueError) {
      throw new Error('Failed to queue website for analysis');
    }

    return {
      status: 'Queued',
      details: {
        lastChecked: new Date().toISOString(),
        chatSolutions: []
      }
    };

  } catch (error) {
    console.error('Error processing website:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      status: 'Error',
      details: { 
        errorDetails: errorMessage,
        lastChecked: new Date().toISOString(),
        chatSolutions: []
      }
    };
  }
};
