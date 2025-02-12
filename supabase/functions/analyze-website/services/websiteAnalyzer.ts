
import { CHATBOT_PROVIDERS } from '../providers/chatbotProviders.ts';
import { ChatDetectionResult } from '../types.ts';
import { getCachedAnalysis, updateCache } from './cacheService.ts';

export async function analyzeWebsite(url: string): Promise<ChatDetectionResult> {
  try {
    console.log('Starting analysis for URL:', url);
    
    // Skip analysis for Google Maps URLs
    if (url.includes('maps.google.com')) {
      console.log('Skipping Google Maps URL');
      return {
        status: 'skipped',
        chatSolutions: [],
        lastChecked: new Date().toISOString(),
        note: 'Skipped Google Maps URL'
      };
    }
    
    // Check cache first
    const cachedResult = await getCachedAnalysis(url);
    if (cachedResult) {
      return cachedResult;
    }

    console.log('No recent cache found, analyzing website:', url);

    // Set up fetch with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      // Fetch and analyze website
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ChatbotAnalyzer/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      console.log('Successfully fetched HTML content');

      // Check for chatbot providers
      const detectedProviders = [];
      const details = {};

      for (const [key, provider] of Object.entries(CHATBOT_PROVIDERS)) {
        try {
          const detected = provider.signatures.some(sig => 
            html.toLowerCase().includes(sig.toLowerCase())
          );

          if (detected) {
            detectedProviders.push(provider.name);
            details[key] = {
              detected: true,
              name: provider.name,
              signatures_found: provider.signatures.filter(sig => 
                html.toLowerCase().includes(sig.toLowerCase())
              )
            };
            console.log('Detected provider:', provider.name);
          }
        } catch (providerError) {
          console.error(`Error checking provider ${key}:`, providerError);
        }
      }

      // Update cache
      await updateCache(url, detectedProviders.length > 0, detectedProviders, details);

      return {
        status: 'success',
        chatSolutions: detectedProviders,
        lastChecked: new Date().toISOString()
      };

    } catch (fetchError) {
      clearTimeout(timeout);
      throw new Error(`Failed to fetch website: ${fetchError.message}`);
    }

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Record error in cache
    await updateCache(
      url, 
      false, 
      [], 
      { error: error.message }, 
      true,
      error.message
    );

    throw error;
  }
}
