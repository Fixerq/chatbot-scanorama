
import { ChatDetectionResult } from '../types.ts';
import { tryFetch } from './analyzer/fetchService.ts';
import { processContent } from './analyzer/contentProcessor.ts';
import { processUrl } from './urlProcessor.ts';

export async function websiteAnalyzer(url: string): Promise<ChatDetectionResult> {
  console.log('[Analyzer] Starting analysis for:', url);
  
  try {
    // Process and validate URL
    const { cleanUrl, urlObj } = await processUrl(url);
    console.log('[Analyzer] Processed URL:', cleanUrl, 'Original URL:', url);
    
    // Fetch and process the content
    console.log('[Analyzer] Attempting to fetch content from:', urlObj.toString());
    const response = await tryFetch(urlObj.toString());
    
    if (!response.ok) {
      console.error('[Analyzer] Fetch failed:', response.status, response.statusText);
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    console.log('[Analyzer] Successfully fetched content, getting reader');
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

    console.log('[Analyzer] Content processing results:', {
      hasDynamicChat,
      hasChatElements,
      hasMetaTags,
      hasWebSockets,
      detectedSolutions: detectedSolutions.length,
      liveElements: liveElements.length
    });

    const has_chatbot = hasDynamicChat || hasChatElements || hasMetaTags || hasWebSockets || detectedSolutions.length > 0;
    const has_live_elements = liveElements.length > 0;

    console.log('[Analyzer] Analysis complete:', {
      url: cleanUrl,
      has_chatbot,
      has_live_elements,
      detectedSolutions,
      liveElements: liveElements.length
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
    throw error; // Let the error handler in the request handler deal with this
  }
}
