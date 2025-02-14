
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

export const analyzeWebsites = async (urls: string[]): Promise<WebsiteAnalysisResult[]> => {
  console.log('Analyzing batch of URLs:', urls);
  
  try {
    // Get active detection patterns once for all URLs
    const patterns = await getActivePatterns();
    console.log(`Loaded ${patterns.length} detection patterns`);

    const validUrls = urls.map(validateUrl);
    console.log('Validated URLs:', validUrls);

    const { data, error } = await supabase.functions.invoke('analyze-website', {
      body: { urls: validUrls }
    });

    if (error) {
      console.error('Batch analysis error:', error);
      throw error;
    }

    console.log('Batch analysis results:', data);
    return data.map((result: any) => ({
      status: result.status || 'Error',
      details: {
        lastChecked: result.lastChecked || new Date().toISOString(),
        chatSolutions: result.chatSolutions || [],
        errorDetails: result.error
      }
    }));

  } catch (error) {
    console.error('Error processing websites:', error);
    return urls.map(url => ({
      status: 'Error',
      details: {
        lastChecked: new Date().toISOString(),
        errorDetails: error instanceof Error ? error.message : 'Unknown error occurred',
        chatSolutions: []
      }
    }));
  }
};

export const analyzeWebsite = async (url: string): Promise<WebsiteAnalysisResult> => {
  try {
    const results = await analyzeWebsites([url]);
    return results[0];
  } catch (error) {
    console.error('Error analyzing website:', error);
    return {
      status: 'Error',
      details: {
        lastChecked: new Date().toISOString(),
        errorDetails: error instanceof Error ? error.message : 'Unknown error occurred',
        chatSolutions: []
      }
    };
  }
};
