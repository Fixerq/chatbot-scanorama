
import { WEBSOCKET_PATTERNS } from '../patterns/websocketPatterns';
import { logPatternMatch } from '../utils/logger';

export function detectWebSockets(html: string): boolean {
  try {
    console.log('[PatternDetection] Starting WebSocket detection');
    const matched = WEBSOCKET_PATTERNS.some(({ pattern }) => {
      const result = pattern.test(html);
      if (result) {
        const match = html.match(pattern);
        logPatternMatch('WebSocket', pattern, match?.[0]);
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

