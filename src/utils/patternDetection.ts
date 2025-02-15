
// Pre-compiled patterns for better performance
const DYNAMIC_PATTERNS = [
  /window\.(onload|addEventListener).*chat/i,
  /document\.(ready|addEventListener).*chat/i,
  /(?:loadChat|initChat|startChat|chatInit|initializeChat)/i,
  /(?:chat|messenger|support|bot|widget|engage).*(?:load|init|start)/i,
  /(?:load|init|start).*(?:chat|messenger|support|bot|widget|engage)/i,
  /botmanager/i,
  /webchat/i,
  /messageus/i,
  /chatbot/i,
  /livechat/i,
  /live-chat/i,
  /dental-chat/i,
  /support-widget/i
].map(pattern => ({ pattern, type: 'dynamic' as const }));

const ELEMENT_PATTERNS = [
  /<(?:div|iframe|button|script|link|img|span)[^>]*(?:chat|messenger|support|bot|widget|engage)[^>]*>/i,
  /class=["'][^"']*(?:chat|messenger|support|bot|widget)[^"']*["']/i,
  /id=["'][^"']*(?:chat|messenger|support|bot|widget)[^"']*["']/i,
  /data-(?:chat|messenger|support|widget|bot)[^=]*=["'][^"']*["']/i,
  /botmanager/i,
  /webchat/i,
  /messageus/i,
  /chatbot/i,
  /live-?chat/i,
  /dental-?chat/i,
  /support-?widget/i,
  /chat-?window/i,
  /chat-?button/i,
  /chat-?container/i,
  /chat-?box/i,
  /chat-?frame/i,
  /messenger-?frame/i,
  /messenger-?widget/i
].map(pattern => ({ pattern, type: 'element' as const }));

const META_PATTERNS = [
  /<meta[^>]*(?:chat|messenger|support|bot|widget)[^>]*>/i,
  /(?:chat|messenger|bot|widget|engage).*(?:config|settings)/i,
  /(?:config|settings).*(?:chat|messenger|bot|widget|engage)/i,
  /botmanager/i,
  /webchat/i,
  /messageus/i,
  /chatbot/i,
  /livechat/i,
  /dental-chat/i,
  /support-widget/i
].map(pattern => ({ pattern, type: 'meta' as const }));

const WEBSOCKET_PATTERNS = [
  /(?:new WebSocket|WebSocket\.).*(?:chat|messenger|widget|engage)/i,
  /(?:ws|wss):\/\/[^"']*(?:chat|messenger|widget|engage)[^"']*/i,
  /(?:socket|websocket).*(?:chat|messenger|widget|engage)/i,
  /(?:chat|messenger|widget|engage).*(?:socket|websocket)/i,
  /botmanager/i,
  /webchat/i,
  /messageus/i,
  /chatbot/i,
  /livechat/i,
  /dental-chat/i,
  /support-widget/i
].map(pattern => ({ pattern, type: 'websocket' as const }));

interface PatternMatch {
  pattern: RegExp;
  type: 'dynamic' | 'element' | 'meta' | 'websocket';
  matched?: string;
}

/**
 * Detects dynamic loading patterns in HTML content
 * @param html - The HTML content to analyze
 * @returns boolean indicating if dynamic loading patterns were found
 */
export function detectDynamicLoading(html: string): boolean {
  try {
    console.log('[PatternDetection] Starting dynamic loading detection for content:', html.substring(0, 200));
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

/**
 * Detects chat-related elements in HTML content
 * @param html - The HTML content to analyze
 * @returns boolean indicating if chat elements were found
 */
export function detectChatElements(html: string): boolean {
  try {
    console.log('[PatternDetection] Starting chat elements detection for content:', html.substring(0, 200));
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

/**
 * Detects WebSocket usage for chat functionality
 * @param html - The HTML content to analyze
 * @returns boolean indicating if WebSocket patterns were found
 */
export function detectWebSockets(html: string): boolean {
  try {
    console.log('[PatternDetection] Starting WebSocket detection for content:', html.substring(0, 200));
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

/**
 * Gets detailed pattern matches with their types
 * @param html - The HTML content to analyze
 * @returns Array of pattern matches with their types
 */
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

