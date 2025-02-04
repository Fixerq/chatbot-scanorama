import { CHAT_PATTERNS } from './patterns.ts';
import { normalizeUrl } from './utils/urlUtils.ts';
import { fetchWithRetry } from './utils/httpUtils.ts';

export async function analyzeChatbot(url: string): Promise<string[]> {
  console.log('Analyzing URL:', url);
  
  try {
    const normalizedUrl = normalizeUrl(url);
    console.log('Normalized URL:', normalizedUrl);
    
    const response = await fetchWithRetry(normalizedUrl);
    const html = await response.text();
    console.log('Successfully fetched HTML content');
    
    const detectedChatSolutions = new Set<string>();

    // Batch pattern matching for better performance
    const htmlLowerCase = html.toLowerCase();
    
    // Check for specific chat solutions
    for (const [solution, patterns] of Object.entries(CHAT_PATTERNS)) {
      // Use some() to short-circuit as soon as we find a match
      if (patterns.some(pattern => pattern.test(htmlLowerCase))) {
        detectedChatSolutions.add(solution);
        // Break early if we've found this solution
        continue;
      }
    }

    // Convert Set back to array for response
    const results = Array.from(detectedChatSolutions);
    console.log('Analysis complete. Detected solutions:', results);
    return results;
  } catch (error) {
    console.error('Error analyzing website:', error);
    throw error;
  }
}