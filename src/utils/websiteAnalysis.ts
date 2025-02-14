
import { supabase } from '@/integrations/supabase/client';

interface WebsiteAnalysisResult {
  status: string;
  details: {
    lastChecked: string;
    errorDetails?: string;
    chatSolutions?: string[];
  };
}

interface ChatbotPattern {
  id: number;
  pattern: string;
  method: 'selector' | 'script' | 'iframe' | 'text' | 'mutation';
  provider: string | null;
  description: string | null;
  is_active: boolean;
  priority: number;
  timeout_ms: number;
}

async function getActivePatterns(): Promise<ChatbotPattern[]> {
  const { data: patterns, error } = await supabase
    .from('chatbot_detection_patterns')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true });

  if (error) {
    console.error('Error fetching chatbot detection patterns:', error);
    throw new Error('Failed to fetch detection patterns');
  }

  return patterns || [];
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
          chatSolutions: cachedResult.chatbot_platforms || [],
        }
      };
    }

    // Get active detection patterns
    const patterns = await getActivePatterns();
    console.log(`Loaded ${patterns.length} detection patterns`);

    // If no cached result, queue for analysis with patterns
    const { data: queueItem, error: queueError } = await supabase
      .from('website_analysis_queue')
      .insert([{
        website_url: validatedUrl,
        status: 'pending',
        analysis_result: { 
          patterns: patterns.map(p => ({
            id: p.id,
            pattern: p.pattern,
            method: p.method,
            provider: p.provider
          }))
        }
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
