
import { PatternMatch } from '../types';
import { DYNAMIC_PATTERNS } from '../patterns/dynamicPatterns';
import { ELEMENT_PATTERNS } from '../patterns/elementPatterns';
import { META_PATTERNS } from '../patterns/metaPatterns';
import { WEBSOCKET_PATTERNS } from '../patterns/websocketPatterns';
import { logPatternMatch } from '../utils/logger';

export function getDetailedMatches(html: string): PatternMatch[] {
  try {
    console.log('[PatternDetection] Starting detailed pattern matching');
    const allPatterns = [
      ...DYNAMIC_PATTERNS,
      ...ELEMENT_PATTERNS,
      ...META_PATTERNS,
      ...WEBSOCKET_PATTERNS
    ];

    const matches = allPatterns
      .map(patternObj => {
        try {
          const match = html.match(patternObj.pattern);
          if (match) {
            logPatternMatch(patternObj.type, patternObj.pattern, match[0]);
            return {
              ...patternObj,
              matched: match[0]
            };
          }
          return null;
        } catch (error) {
          console.error('[PatternDetection] Error testing pattern:', {
            pattern: patternObj.pattern.toString(),
            error: error.message
          });
          return null;
        }
      })
      .filter((match): match is PatternMatch & { matched: string } => match !== null);

    console.log('[PatternDetection] Detailed pattern matching complete. Found matches:', matches.length);
    return matches;
  } catch (error) {
    console.error('[PatternDetection] Error in getDetailedMatches:', error);
    return [];
  }
}

