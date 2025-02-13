
import { ChatDetectionResult } from '../types.ts';
import { tryFetch } from './analyzer/fetchService.ts';
import { processContent } from './analyzer/contentProcessor.ts';

export async function websiteAnalyzer(url: string): Promise<ChatDetectionResult> {
  console.log('Analyzing website:', url);
  
  try {
    // Skip problematic URLs
    if (url.includes('maps.google.com') || url.includes('google.com/maps')) {
      return {
        status: 'skipped',
        has_chatbot: false,
        chatSolutions: [],
        details: {
          url,
          reason: 'Google Maps URL skipped'
        },
        lastChecked: new Date().toISOString()
      };
    }

    // Clean up the URL
    const cleanUrl = url.trim().replace(/\/$/, '');
    
    // Add www. if not present and no subdomain exists
    const urlObj = new URL(cleanUrl);
    if (!urlObj.hostname.includes('.') && !urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = 'www.' + urlObj.hostname;
      console.log('Added www subdomain:', urlObj.toString());
    }
    
    // Fetch and process the content
    console.log('Attempting to fetch:', urlObj.toString());
    const response = await tryFetch(urlObj.toString());
    const reader = response.body?.getReader();
    
    if (!reader) {
      throw new Error('Could not get response body reader');
    }

    // Process the content and detect chatbot presence
    const {
      hasDynamicChat,
      hasChatElements,
      hasMetaTags,
      hasWebSockets,
      detectedSolutions
    } = await processContent(reader);

    const has_chatbot = hasDynamicChat || hasChatElements || hasMetaTags || hasWebSockets || detectedSolutions.length > 0;

    console.log('Final analysis:', {
      has_chatbot,
      detectedSolutions
    });

    return {
      status: 'success',
      has_chatbot,
      chatSolutions: detectedSolutions,
      details: {
        dynamic_loading: hasDynamicChat,
        chat_elements: hasChatElements,
        meta_tags: hasMetaTags,
        websockets: hasWebSockets,
        url: cleanUrl
      },
      lastChecked: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error analyzing website:', error);
    
    return {
      status: 'error',
      error: error.message,
      has_chatbot: false,
      chatSolutions: [],
      details: {
        url: url,
        errorType: error.name,
        errorMessage: error.message
      },
      lastChecked: new Date().toISOString()
    };
  }
}
