
import { DYNAMIC_PATTERNS } from './patterns/dynamicPatterns.ts';
import { ELEMENT_PATTERNS } from './patterns/elementPatterns.ts';
import { META_PATTERNS } from './patterns/metaPatterns.ts';
import { WEBSOCKET_PATTERNS } from './patterns/websocketPatterns.ts';
import { LIVE_CHAT_PATTERNS } from './patterns/liveChatPatterns.ts';

export function detectChatElements(html: string): { has_chatbot: boolean; matches: string[] } {
  try {
    console.log('[PatternDetection] Starting chat elements detection');
    const allPatterns = [
      ...DYNAMIC_PATTERNS,
      ...ELEMENT_PATTERNS,
      ...META_PATTERNS,
      ...WEBSOCKET_PATTERNS,
      ...LIVE_CHAT_PATTERNS
    ];

    const matches: string[] = [];
    let has_chatbot = false;

    allPatterns.forEach(({ pattern, type }) => {
      const result = pattern.test(html);
      if (result) {
        has_chatbot = true;
        const match = html.match(pattern);
        console.log('[PatternDetection] Pattern matched:', {
          type,
          pattern: pattern.toString(),
          matchedContent: match ? match[0] : 'No match content'
        });
        matches.push(type);
      }
    });

    console.log('[PatternDetection] Chat elements detection complete:', {
      has_chatbot,
      matches
    });

    return { has_chatbot, matches };
  } catch (error) {
    console.error('[PatternDetection] Error in detectChatElements:', error);
    return { has_chatbot: false, matches: [] };
  }
}
