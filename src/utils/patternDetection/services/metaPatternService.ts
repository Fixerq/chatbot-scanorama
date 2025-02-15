
import { META_PATTERNS } from '../patterns/metaPatterns';
import { logPatternMatch } from '../utils/logger';

export function detectMetaTags(html: string): boolean {
  try {
    console.log('[PatternDetection] Starting meta tags detection');
    const matched = META_PATTERNS.some(({ pattern }) => {
      const result = pattern.test(html);
      if (result) {
        const match = html.match(pattern);
        logPatternMatch('Meta', pattern, match?.[0]);
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

