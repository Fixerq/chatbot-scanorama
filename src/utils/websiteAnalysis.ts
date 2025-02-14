
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // Increased delay between retries
const ANALYSIS_TIMEOUT = 30000; // 30 second timeout for analysis

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeWebsites = async (urls: string[], retryCount = 0): Promise<WebsiteAnalysisResult[]> => {
  console.log('Analyzing batch of URLs:', urls);
  
  try {
    const patterns = await getActivePatterns();
    console.log(`Loaded ${patterns.length} detection patterns`);

    const validUrls = urls.map(validateUrl);
    console.log('Validated URLs:', validUrls);

    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Analysis timeout')), ANALYSIS_TIMEOUT);
    });

    // Create the analysis promise
    const analysisPromise = supabase.functions.invoke('analyze-website', {
      body: { urls: validUrls }
    });

    // Race between timeout and analysis
    const { data, error } = await Promise.race([analysisPromise, timeoutPromise]) as any;

    if (error) {
      console.error('Batch analysis error:', error);
      
      // Handle rate limiting
      if (error.status === 429) {
        if (retryCount < MAX_RETRIES) {
          console.log(`Rate limited, retrying after delay (attempt ${retryCount + 1})`);
          await delay(RETRY_DELAY * (retryCount + 1));
          return analyzeWebsites(urls, retryCount + 1);
        }
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      // Handle service unavailability
      if (error.status === 503) {
        if (retryCount < MAX_RETRIES) {
          console.log(`Service unavailable, retrying after delay (attempt ${retryCount + 1})`);
          await delay(RETRY_DELAY * (retryCount + 1));
          return analyzeWebsites(urls, retryCount + 1);
        }
        throw new Error('Service temporarily unavailable. Please try again later.');
      }

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    toast.error(errorMessage);
    
    return urls.map(url => ({
      status: 'Error',
      details: {
        lastChecked: new Date().toISOString(),
        errorDetails: errorMessage,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    toast.error(errorMessage);
    
    return {
      status: 'Error',
      details: {
        lastChecked: new Date().toISOString(),
        errorDetails: errorMessage,
        chatSolutions: []
      }
    };
  }
};
