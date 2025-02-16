
import { CHAT_PATTERNS } from '../../patterns.ts';
import { detectChatElements, detectDynamicLoading, detectMetaTags, detectWebSockets, getDetailedMatches } from '../../utils/patternDetection.ts';

const MAX_HTML_SIZE = 5 * 1024 * 1024; // 5MB limit

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
  let totalSize = 0;
  const detectedSolutions = new Set<string>();
  const liveElements = new Set<string>();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Check size limits
      totalSize += value.byteLength;
      if (totalSize > MAX_HTML_SIZE) {
        throw new Error('Content too large to process');
      }

      // Convert the Uint8Array to string and append to htmlContent
      const chunk = new TextDecoder().decode(value);
      htmlContent += chunk;

      // Process patterns incrementally on each chunk to reduce memory usage
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
    console.log(`[ContentProcessor] Total content size: ${totalSize} bytes`);

    // Process the complete HTML content
    const hasDynamicChat = detectDynamicLoading(htmlContent);
    const hasChatElements = detectChatElements(htmlContent);
    const hasMetaTags = detectMetaTags(htmlContent);
    const hasWebSockets = detectWebSockets(htmlContent);

    // Get detailed pattern matches for debugging
    const detailedMatches = getDetailedMatches(htmlContent);
    console.log('[ContentProcessor] Detailed pattern matches:', detailedMatches);

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
    try {
      reader.releaseLock();
      console.log('[ContentProcessor] Successfully released reader lock');
    } catch (cleanupError) {
      console.error('[ContentProcessor] Error during cleanup:', cleanupError);
    }
  }
}
