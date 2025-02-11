
import { CHAT_PATTERNS } from './patterns.ts';
import { normalizeUrl } from './utils/urlUtils.ts';
import { fetchWithRetry } from './utils/httpUtils.ts';

export async function analyzeChatbot(url: string): Promise<string[]> {
  console.log('Starting analysis for URL:', url);
  
  try {
    const normalizedUrl = normalizeUrl(url);
    console.log('Normalized URL:', normalizedUrl);
    
    const response = await fetchWithRetry(normalizedUrl);
    if (!response.ok) {
      console.error('Failed to fetch URL:', response.status, response.statusText);
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('Successfully fetched HTML content, length:', html.length);
    
    if (!html.trim()) {
      console.warn('Empty HTML content received');
      return [];
    }

    const detectedChatSolutions = new Set<string>();
    const htmlLowerCase = html.toLowerCase();
    
    // Check for specific chat solutions
    for (const [solution, patterns] of Object.entries(CHAT_PATTERNS)) {
      try {
        if (patterns.some(pattern => pattern.test(htmlLowerCase))) {
          detectedChatSolutions.add(solution);
          console.log('Detected chat solution:', solution);
        }
      } catch (patternError) {
        console.error(`Error checking pattern for ${solution}:`, patternError);
      }
    }

    const results = Array.from(detectedChatSolutions);
    console.log('Analysis complete. Detected solutions:', results);
    return results;

  } catch (error) {
    console.error('Error analyzing website:', error);
    throw error;
  }
}
