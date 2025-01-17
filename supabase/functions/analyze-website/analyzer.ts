import { CHAT_PATTERNS } from './patterns.ts';
import { normalizeUrl } from './utils/urlUtils.ts';
import { fetchWithRetry } from './utils/httpUtils.ts';
import { 
  detectDynamicLoading, 
  detectChatElements, 
  detectMetaTags, 
  detectWebSockets 
} from './utils/patternDetection.ts';

export async function analyzeChatbot(url: string): Promise<string[]> {
  console.log('Analyzing URL:', url);
  
  try {
    const normalizedUrl = normalizeUrl(url);
    console.log('Normalized URL:', normalizedUrl);
    
    const response = await fetchWithRetry(normalizedUrl);
    const html = await response.text();
    console.log('Successfully fetched HTML content');
    
    const detectedChatSolutions: string[] = [];

    // Check for specific chat solutions
    for (const [solution, patterns] of Object.entries(CHAT_PATTERNS)) {
      if (patterns.some(pattern => {
        const matches = pattern.test(html);
        if (matches) {
          console.log(`Detected ${solution} using pattern:`, pattern);
        }
        return matches;
      })) {
        if (!detectedChatSolutions.includes(solution)) {
          detectedChatSolutions.push(solution);
        }
      }
    }

    // Check for dynamic loading patterns
    if (detectDynamicLoading(html) && !detectedChatSolutions.includes('Custom Chat')) {
      console.log('Detected dynamically loaded chat widget');
      detectedChatSolutions.push('Custom Chat');
    }

    // Check for common chat-related elements
    if (detectChatElements(html) && !detectedChatSolutions.includes('Custom Chat')) {
      console.log('Detected common chat elements');
      detectedChatSolutions.push('Custom Chat');
    }

    // Check for chat-related meta tags and configurations
    if (detectMetaTags(html) && !detectedChatSolutions.includes('Custom Chat')) {
      console.log('Detected chat-related meta tags or configurations');
      detectedChatSolutions.push('Custom Chat');
    }

    // Check for WebSocket connections related to chat
    if (detectWebSockets(html) && !detectedChatSolutions.includes('Custom Chat')) {
      console.log('Detected WebSocket-based chat');
      detectedChatSolutions.push('Custom Chat');
    }

    console.log('Analysis complete. Detected solutions:', detectedChatSolutions);
    return detectedChatSolutions;
  } catch (error) {
    console.error('Error analyzing website:', error);
    throw error;
  }
}