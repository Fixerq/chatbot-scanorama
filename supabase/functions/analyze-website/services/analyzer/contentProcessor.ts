
import { CHAT_PATTERNS } from '../../patterns';
import { detectChatElements, detectDynamicLoading, detectMetaTags, detectWebSockets } from '../../utils/patternDetection';

export async function processContent(reader: ReadableStreamDefaultReader): Promise<{
  hasDynamicChat: boolean;
  hasChatElements: boolean;
  hasMetaTags: boolean;
  hasWebSockets: boolean;
  detectedSolutions: string[];
  liveElements: string[];
}> {
  console.log('[ContentProcessor] Starting content processing');
  let htmlContent = '';
  const detectedSolutions = new Set<string>();
  const liveElements = new Set<string>();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Convert the Uint8Array to string and append to htmlContent
      const chunk = new TextDecoder().decode(value);
      htmlContent += chunk;

      // Check for chat solutions in the chunk
      Object.entries(CHAT_PATTERNS).forEach(([solution, patterns]) => {
        if (Array.isArray(patterns)) {
          patterns.forEach(pattern => {
            if (typeof pattern === 'string' && chunk.includes(pattern)) {
              detectedSolutions.add(solution);
            } else if (pattern instanceof RegExp && pattern.test(chunk)) {
              detectedSolutions.add(solution);
            }
          });
        }
      });
    }

    console.log('[ContentProcessor] Finished reading content, analyzing patterns');

    // Process the complete HTML content
    const hasDynamicChat = detectDynamicLoading(htmlContent);
    const hasChatElements = detectChatElements(htmlContent);
    const hasMetaTags = detectMetaTags(htmlContent);
    const hasWebSockets = detectWebSockets(htmlContent);

    return {
      hasDynamicChat,
      hasChatElements,
      hasMetaTags,
      hasWebSockets,
      detectedSolutions: Array.from(detectedSolutions),
      liveElements: Array.from(liveElements)
    };

  } catch (error) {
    console.error('[ContentProcessor] Error processing content:', error);
    throw error;
  } finally {
    reader.releaseLock();
  }
}
