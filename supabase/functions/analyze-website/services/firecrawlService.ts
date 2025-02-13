
import { FirecrawlAnalysisResult } from '../types.ts';
import { saveChatbotDetection } from './databaseService.ts';
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@latest';
import { handleFirecrawlError } from '../utils/errors/firecrawlErrors.ts';

let firecrawlClient: FirecrawlApp | null = null;

export const initializeFirecrawl = () => {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    throw new Error('Firecrawl API key not found');
  }
  firecrawlClient = new FirecrawlApp({ apiKey });
};

// Exponential backoff for retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeWithFirecrawl = async (url: string): Promise<FirecrawlAnalysisResult> => {
  console.log('Starting Firecrawl analysis for:', url);
  
  if (!firecrawlClient) {
    initializeFirecrawl();
  }

  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Add rate limiting delay between attempts
      if (attempt > 0) {
        const backoffDelay = BASE_DELAY * Math.pow(2, attempt);
        console.log(`Waiting ${backoffDelay}ms before retry`);
        await delay(backoffDelay);
      }

      const response = await firecrawlClient.crawlUrl(url, {
        limit: 1,
        scrapeOptions: {
          formats: ['html', 'markdown'],
          timeout: 30000, // 30 second timeout
          javascript: true,
          waitFor: 2000 // Wait for JavaScript to load
        }
      });

      console.log('Raw Firecrawl response:', response);

      if (!response.success) {
        // Check for specific error types
        if (response.error?.includes('429')) {
          console.warn('Rate limit hit. Retrying...');
          continue; // Retry on rate limit
        }
        if (response.error?.includes('402')) {
          throw new Error('Insufficient Firecrawl credits');
        }
        throw new Error(response.error || 'Firecrawl analysis failed');
      }

      // Save to chatbot_detections table
      await saveChatbotDetection({
        url,
        website_url: url,
        has_chatbot: false, // We'll update this based on analysis
        chatbot_platforms: [],
        last_checked: new Date().toISOString()
      });

      return {
        status: 'success',
        content: response.data.content,
        analyzed_at: new Date().toISOString(),
        metadata: response.data
      };
    } catch (error) {
      console.error('Firecrawl analysis error:', error);
      
      // If it's the last attempt, throw the error
      if (attempt === MAX_RETRIES - 1) {
        const errorMessage = handleFirecrawlError(error);
        return {
          status: 'error',
          error: errorMessage,
          analyzed_at: new Date().toISOString()
        };
      }
    }
  }

  // Fallback error if all retries fail
  return {
    status: 'error',
    error: 'Failed to analyze website after multiple attempts',
    analyzed_at: new Date().toISOString()
  };
};

// Optional: Add a method to check Firecrawl credits
export const checkFirecrawlCredits = async (): Promise<number> => {
  if (!firecrawlClient) {
    initializeFirecrawl();
  }

  try {
    // Note: This is a hypothetical method. Firecrawl's actual API might differ.
    const creditsResponse = await firecrawlClient.checkCredits();
    console.log('Firecrawl credits:', creditsResponse.credits);
    return creditsResponse.credits;
  } catch (error) {
    console.error('Error checking Firecrawl credits:', error);
    return 0;
  }
};
