
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
  const seenMatches = new Set<string>();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      
      // Skip analysis if the content appears to be from Google Maps
      if (html.toLowerCase().includes('maps.google.com') || 
          html.toLowerCase().includes('google.com/maps') ||
          html.includes('Google Maps JavaScript API') ||
          html.includes('google-maps-api')) {
        console.log('Google Maps content detected, skipping analysis');
        break;
      }
      
      // Check for chat solutions
      for (const [provider, patterns] of Object.entries(CHAT_PATTERNS)) {
        if (!detectedSolutions.includes(provider)) {
          for (const pattern of patterns) {
            if (html.includes(pattern)) {
              detectedSolutions.push(provider);
              break;
            }
          }
        }
      }

      // Check for live elements
      for (const [elementType, patterns] of Object.entries(LIVE_ELEMENT_PATTERNS)) {
        for (const pattern of patterns) {
          const matches = html.match(pattern);
          if (matches) {
            matches.forEach(match => {
              const matchKey = `${elementType}-${match}`;
              if (!seenMatches.has(matchKey)) {
                seenMatches.add(matchKey);
                liveElements.push({
                  type: elementType,
                  pattern: pattern.toString(),
                  matched: match,
                  confidence: calculateConfidence(match, elementType)
                });
              }
            });
          }
        }
      }
      
      // Stop if we've found enough evidence or reached size limit
      if (html.length > 500000 || 
          (detectedSolutions.length > 0 && liveElements.length > 2)) {
        break;
      }
    }
  } catch (error) {
    console.error('Error processing content:', error);
  } finally {
    reader.releaseLock();
  }

  return {
    hasDynamicChat: detectDynamicLoading(html),
    hasChatElements: detectChatElements(html),
    hasMetaTags: detectMetaTags(html),
    hasWebSockets: detectWebSockets(html),
    detectedSolutions: Array.from(new Set(detectedSolutions)), // Deduplicate
    liveElements: liveElements.slice(0, 10) // Limit to top 10 elements
  };
}

function calculateConfidence(match: string, type: string): number {
  let confidence = 0.7; // Base confidence

  // Increase confidence based on specific indicators
  if (match.toLowerCase().includes('chat')) confidence += 0.1;
  if (match.toLowerCase().includes('widget')) confidence += 0.1;
  if (match.toLowerCase().includes('messenger')) confidence += 0.1;
  if (match.toLowerCase().includes('support')) confidence += 0.1;
  if (match.toLowerCase().includes('help')) confidence += 0.1;

  // Adjust based on match length (penalize very short matches)
  if (match.length < 5) confidence -= 0.2;
  if (match.length > 20) confidence -= 0.1;

  // Ensure confidence stays in valid range
  return Math.min(Math.max(confidence, 0), 1);
}

