import { CHAT_PATTERNS } from './patterns.ts';

export async function analyzeChatbot(url: string): Promise<string[]> {
  console.log('Analyzing URL:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChatbotDetector/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log('Successfully fetched HTML content');
    
    const detectedChatSolutions: string[] = [];

    for (const [solution, patterns] of Object.entries(CHAT_PATTERNS)) {
      if (patterns.some(pattern => {
        const matches = pattern.test(html);
        if (matches) {
          console.log(`Detected ${solution} using pattern:`, pattern);
        }
        return matches;
      })) {
        detectedChatSolutions.push(solution);
      }
    }

    // Check for dynamic loading
    const hasDynamicChatLoading = /window\.(onload|addEventListener).*chat/i.test(html) ||
                                 /document\.(ready|addEventListener).*chat/i.test(html);
    
    if (hasDynamicChatLoading && !detectedChatSolutions.includes('Custom Chat')) {
      console.log('Detected dynamically loaded chat widget');
      detectedChatSolutions.push('Custom Chat');
    }

    return detectedChatSolutions;
  } catch (error) {
    console.error('Error analyzing website:', error);
    throw error;
  }
}