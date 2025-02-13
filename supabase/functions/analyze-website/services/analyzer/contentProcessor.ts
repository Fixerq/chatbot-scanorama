
import { detectDynamicLoading, detectChatElements, detectMetaTags, detectWebSockets } from '../../utils/patternDetection.ts';
import { CHAT_PATTERNS } from '../../patterns.ts';

export async function processContent(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<{
  hasDynamicChat: boolean;
  hasChatElements: boolean;
  hasMetaTags: boolean;
  hasWebSockets: boolean;
  detectedSolutions: string[];
}> {
  const decoder = new TextDecoder();
  let html = '';
  const detectedSolutions: string[] = [];

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
    
    // Stop if we've found enough evidence or reached size limit
    if (html.length > 500000 || // Limit to first 500KB
        (detectChatElements(html) && detectMetaTags(html))) {
      break;
    }
  }
  
  reader.releaseLock();

  return {
    hasDynamicChat: detectDynamicLoading(html),
    hasChatElements: detectChatElements(html),
    hasMetaTags: detectMetaTags(html),
    hasWebSockets: detectWebSockets(html),
    detectedSolutions
  };
}
