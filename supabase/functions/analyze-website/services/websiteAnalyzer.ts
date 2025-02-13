
import { ChatDetectionResult } from '../types.ts';
import { CHAT_PATTERNS } from '../patterns.ts';
import { detectDynamicLoading, detectChatElements, detectMetaTags, detectWebSockets } from '../utils/patternDetection.ts';

export async function websiteAnalyzer(url: string): Promise<ChatDetectionResult> {
  console.log('Analyzing website:', url);
  
  try {
    // Fetch the website content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('Successfully fetched website content');

    // Detect chatbot presence using various methods
    const hasDynamicChat = detectDynamicLoading(html);
    const hasChatElements = detectChatElements(html);
    const hasMetaTags = detectMetaTags(html);
    const hasWebSockets = detectWebSockets(html);

    console.log('Analysis results:', {
      hasDynamicChat,
      hasChatElements,
      hasMetaTags,
      hasWebSockets
    });

    // Detect specific chat solutions
    const detectedSolutions: string[] = [];
    for (const [provider, patterns] of Object.entries(CHAT_PATTERNS)) {
      if (patterns.some(pattern => html.includes(pattern))) {
        detectedSolutions.push(provider);
      }
    }

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
        websockets: hasWebSockets
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
      details: {},
      lastChecked: new Date().toISOString()
    };
  }
}
