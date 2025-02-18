
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

    // Convert HTML to lowercase for case-insensitive matching
    const lowerHtml = html.toLowerCase();

    // First check for obvious chat-related content
    const obviousPatterns = [
      'live chat',
      'chat with us',
      'start chat',
      'chat now',
      'chat support',
      'messaging',
      'chat widget',
      'chat box'
    ];

    if (obviousPatterns.some(pattern => lowerHtml.includes(pattern))) {
      has_chatbot = true;
      matches.push('Generic Chat Widget');
    }

    // Then check all our specific patterns
    allPatterns.forEach(({ pattern, type }) => {
      if (pattern.test(html)) {
        has_chatbot = true;
        const match = html.match(pattern);
        console.log('[PatternDetection] Pattern matched:', {
          type,
          pattern: pattern.toString(),
          matchedContent: match ? match[0] : 'No match content'
        });
        if (!matches.includes(type)) {
          matches.push(type);
        }
      }
    });

    // Check for chat-related attributes
    const attributePatterns = [
      /data-[^=]*chat/i,
      /data-[^=]*messaging/i,
      /chat-[^=]*=/i,
      /id="[^"]*chat/i,
      /class="[^"]*chat/i
    ];

    if (attributePatterns.some(pattern => pattern.test(html))) {
      has_chatbot = true;
      if (!matches.includes('Attribute-based Chat Detection')) {
        matches.push('Attribute-based Chat Detection');
      }
    }

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
