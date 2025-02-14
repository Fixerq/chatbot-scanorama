
import { ChatDetectionResult } from '../types.ts';
import { tryFetch } from './analyzer/fetchService.ts';
import { processContent } from './analyzer/contentProcessor.ts';
import { processUrl } from './urlProcessor.ts';

export async function websiteAnalyzer(url: string): Promise<ChatDetectionResult> {
  console.log('[Analyzer] Starting analysis for:', url);
  
  try {
    // Process and validate URL
    const { cleanUrl, urlObj } = await processUrl(url);
    console.log('[Analyzer] Processed URL:', cleanUrl);
    
    // Fetch and process the content
    console.log('[Analyzer] Attempting to fetch:', urlObj.toString());
    const response = await tryFetch(urlObj.toString());
    
    if (!response.ok) {
      console.error('[Analyzer] Fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      console.error('[Analyzer] Could not get response body reader');
      throw new Error('Could not get response body reader');
    }

    console.log('[Analyzer] Processing content for:', cleanUrl);
    
    const {
      hasDynamicChat,
      hasChatElements,
      hasMetaTags,
      hasWebSockets,
      detectedSolutions,
      liveElements
    } = await processContent(reader);

    const has_chatbot = hasDynamicChat || hasChatElements || hasMetaTags || hasWebSockets || detectedSolutions.length > 0;
    const has_live_elements = liveElements.length > 0;

    console.log('[Analyzer] Analysis complete:', {
      url: cleanUrl,
      has_chatbot,
      has_live_elements,
      detectedSolutions,
      liveElements
    });

    return {
      status: 'success',
      has_chatbot,
      has_live_elements,
      chatSolutions: detectedSolutions,
      liveElements,
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
    console.error('[Analyzer] Error analyzing website:', error);
    return {
      status: 'error',
      error: error.message,
      has_chatbot: false,
      has_live_elements: false,
      chatSolutions: [],
      liveElements: [],
      details: {
        url: url,
        errorType: error.name,
        errorMessage: error.message
      },
      lastChecked: new Date().toISOString()
    };
  }
}
