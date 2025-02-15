
import { DYNAMIC_PATTERNS } from '../patterns/dynamicPatterns';
import { logPatternMatch } from '../utils/logger';

export function detectDynamicLoading(html: string): boolean {
  try {
    console.log('[PatternDetection] Starting dynamic loading detection');
    const matched = DYNAMIC_PATTERNS.some(({ pattern }) => {
      const result = pattern.test(html);
      if (result) {
        const match = html.match(pattern);
        logPatternMatch('Dynamic', pattern, match?.[0]);
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

