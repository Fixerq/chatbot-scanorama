
import { detectDynamicLoading, detectChatElements, detectMetaTags, detectWebSockets } from '../../utils/patternDetection.ts';
import { CHAT_PATTERNS } from '../../patterns.ts';
import { LIVE_ELEMENT_PATTERNS, LIVE_ELEMENT_TYPES } from '../../utils/liveElementPatterns.ts';

export async function processContent(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<{
  hasDynamicChat: boolean;
  hasChatElements: boolean;
  hasMetaTags: boolean;
  hasWebSockets: boolean;
  detectedSolutions: string[];
  liveElements: Array<{
    type: string;
    pattern: string;
    matched: string;
    confidence: number;
  }>;
}> {
  const decoder = new TextDecoder();
  let html = '';
  const detectedSolutions: string[] = [];
  const liveElements: Array<{
    type: string;
    pattern: string;
    matched: string;
    confidence: number;
  }> = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    html += decoder.decode(value, { stream: true });
    
    // Check for chat solutions while processing
    for (const [provider, patterns] of Object.entries(CHAT_PATTERNS)) {
      if (!detectedSolutions.includes(provider) && patterns.some(pattern => html.includes(pattern))) {
        detectedSolutions.push(provider);
      }
    }

    // Check for live elements
    for (const [elementType, patterns] of Object.entries(LIVE_ELEMENT_PATTERNS)) {
      patterns.forEach(pattern => {
        const matches = html.match(pattern);
        if (matches) {
          matches.forEach(match => {
            if (!liveElements.some(el => el.matched === match)) {
              liveElements.push({
                type: elementType,
                pattern: pattern.toString(),
                matched: match,
                confidence: 0.8 // Basic confidence score, could be refined
              });
            }
          });
        }
      });
    }
    
    // Stop if we've found enough evidence or reached size limit
    if (html.length > 500000 || // Limit to first 500KB
        (detectedSolutions.length > 0 && liveElements.length > 0)) {
      break;
    }
  }
  
  reader.releaseLock();

  return {
    hasDynamicChat: detectDynamicLoading(html),
    hasChatElements: detectChatElements(html),
    hasMetaTags: detectMetaTags(html),
    hasWebSockets: detectWebSockets(html),
    detectedSolutions,
    liveElements
  };
}
