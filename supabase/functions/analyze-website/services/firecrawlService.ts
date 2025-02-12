
import { FirecrawlAnalysisResult } from '../types.ts';
import { saveChatbotDetection } from './databaseService.ts';
import FirecrawlApp from '@mendable/firecrawl-js';

let firecrawlClient: FirecrawlApp | null = null;

export const initializeFirecrawl = () => {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    throw new Error('Firecrawl API key not found');
  }
  firecrawlClient = new FirecrawlApp({ apiKey });
};

export const analyzeWithFirecrawl = async (url: string): Promise<FirecrawlAnalysisResult> => {
  console.log('Starting Firecrawl analysis for:', url);
  
  if (!firecrawlClient) {
    initializeFirecrawl();
  }

  try {
    const response = await firecrawlClient.crawlUrl(url, {
      limit: 1,
      scrapeOptions: {
        formats: ['html', 'markdown'],
      }
    });

    if (!response.success) {
      throw new Error(response.error || 'Firecrawl analysis failed');
    }

    console.log('Firecrawl analysis completed successfully:', response);

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
    return {
      status: 'error',
      error: error.message,
      analyzed_at: new Date().toISOString()
    };
  }
};
