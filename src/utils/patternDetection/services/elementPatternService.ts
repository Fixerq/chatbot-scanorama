
import { ELEMENT_PATTERNS } from '../patterns/elementPatterns';
import { logPatternMatch } from '../utils/logger';

export function detectChatElements(html: string): boolean {
  try {
    console.log('[PatternDetection] Starting chat elements detection');
    const matched = ELEMENT_PATTERNS.some(({ pattern }) => {
      const result = pattern.test(html);
      if (result) {
        const match = html.match(pattern);
        logPatternMatch('Element', pattern, match?.[0]);
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

