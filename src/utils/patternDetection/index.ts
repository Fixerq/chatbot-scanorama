
import { DYNAMIC_PATTERNS } from './patterns/dynamicPatterns';
import { ELEMENT_PATTERNS } from './patterns/elementPatterns';
import { META_PATTERNS } from './patterns/metaPatterns';
import { WEBSOCKET_PATTERNS } from './patterns/websocketPatterns';
import { PatternMatch } from './types';

export function detectDynamicLoading(html: string): boolean {
  try {
    console.log('[PatternDetection] Starting dynamic loading detection');
    const matched = DYNAMIC_PATTERNS.some(({ pattern }) => {
      const result = pattern.test(html);
      if (result) {
        const match = html.match(pattern);
        console.log('[PatternDetection] Dynamic pattern matched:', {
          pattern: pattern.toString(),
          matchedContent: match ? match[0] : 'No match content'
        });
      }
      return result;
    });
    console.log('[PatternDetection] Dynamic loading detection complete:', matched);
    return matched;
  } catch (error) {
    console.error('[PatternDetection] Error in detectDynamicLoading:', error);
    return false;
  }
}

export function detectChatElements(html: string): boolean {
  try {
    console.log('[PatternDetection] Starting chat elements detection');
    const matched = ELEMENT_PATTERNS.some(({ pattern }) => {
      const result = pattern.test(html);
      if (result) {
        const match = html.match(pattern);
        console.log('[PatternDetection] Element pattern matched:', {
          pattern: pattern.toString(),
          matchedContent: match ? match[0] : 'No match content'
        });
      }
      return result;
    });
    console.log('[PatternDetection] Chat elements detection complete:', matched);
    return matched;
  } catch (error) {
    console.error('[PatternDetection] Error in detectChatElements:', error);
    return false;
  }
}

export function detectMetaTags(html: string): boolean {
  try {
    console.log('[PatternDetection] Starting meta tags detection');
    const matched = META_PATTERNS.some(({ pattern }) => {
      const result = pattern.test(html);
      if (result) {
        const match = html.match(pattern);
        console.log('[PatternDetection] Meta pattern matched:', {
          pattern: pattern.toString(),
          matchedContent: match ? match[0] : 'No match content'
        });
      }
      return result;
    });
    console.log('[PatternDetection] Meta tags detection complete:', matched);
    return matched;
  } catch (error) {
    console.error('[PatternDetection] Error in detectMetaTags:', error);
    return false;
  }
}

export function detectWebSockets(html: string): boolean {
  try {
    console.log('[PatternDetection] Starting WebSocket detection');
    const matched = WEBSOCKET_PATTERNS.some(({ pattern }) => {
      const result = pattern.test(html);
      if (result) {
        const match = html.match(pattern);
        console.log('[PatternDetection] WebSocket pattern matched:', {
          pattern: pattern.toString(),
          matchedContent: match ? match[0] : 'No match content'
        });
      }
      return result;
    });
    console.log('[PatternDetection] WebSocket detection complete:', matched);
    return matched;
  } catch (error) {
    console.error('[PatternDetection] Error in detectWebSockets:', error);
    return false;
  }
}

export function getDetailedMatches(html: string): PatternMatch[] {
  try {
    console.log('[PatternDetection] Starting detailed pattern matching');
    const allPatterns = [
      ...DYNAMIC_PATTERNS,
      ...ELEMENT_PATTERNS,
      ...META_PATTERNS,
      ...WEBSOCKET_PATTERNS
    ];

    const matches = allPatterns.filter(({ pattern }) => {
      try {
        const result = pattern.test(html);
        if (result) {
          const match = html.match(pattern);
          console.log('[PatternDetection] Pattern matched:', {
            pattern: pattern.toString(),
            matchedContent: match ? match[0] : 'No match content'
          });
        }
        return result;
      } catch (error) {
        console.error('[PatternDetection] Error testing pattern:', {
          pattern: pattern.toString(),
          error: error.message
        });
        return false;
      }
    });

    console.log('[PatternDetection] Detailed pattern matching complete. Found matches:', matches.length);
    return matches;
  } catch (error) {
    console.error('[PatternDetection] Error in getDetailedMatches:', error);
    return [];
  }
}

