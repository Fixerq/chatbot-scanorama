
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
].map(pattern => ({ pattern, type: 'dynamic' }));

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
].map(pattern => ({ pattern, type: 'element' }));

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
].map(pattern => ({ pattern, type: 'meta' }));

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
].map(pattern => ({ pattern, type: 'websocket' }));

interface PatternMatch {
  pattern: RegExp;
  type: 'dynamic' | 'element' | 'meta' | 'websocket';
  matched?: string;
}

export function detectDynamicLoading(html: string): boolean {
  console.log('[PatternDetection] Starting dynamic loading detection');
  const matched = DYNAMIC_PATTERNS.some(({ pattern }) => {
    const result = pattern.test(html);
    if (result) {
      console.log('[PatternDetection] Dynamic pattern matched:', pattern.toString());
    }
    return result;
  });
  console.log('[PatternDetection] Dynamic loading detection complete:', matched);
  return matched;
}

export function detectChatElements(html: string): boolean {
  console.log('[PatternDetection] Starting chat elements detection');
  const matched = ELEMENT_PATTERNS.some(({ pattern }) => {
    const result = pattern.test(html);
    if (result) {
      console.log('[PatternDetection] Element pattern matched:', pattern.toString());
      // Log the matching content
      const match = html.match(pattern);
      if (match) {
        console.log('[PatternDetection] Matched content:', match[0]);
      }
    }
    return result;
  });
  console.log('[PatternDetection] Chat elements detection complete:', matched);
  return matched;
}

export function detectMetaTags(html: string): boolean {
  console.log('[PatternDetection] Starting meta tags detection');
  const matched = META_PATTERNS.some(({ pattern }) => {
    const result = pattern.test(html);
    if (result) {
      console.log('[PatternDetection] Meta pattern matched:', pattern.toString());
      // Log the matching content
      const match = html.match(pattern);
      if (match) {
        console.log('[PatternDetection] Matched content:', match[0]);
      }
    }
    return result;
  });
  console.log('[PatternDetection] Meta tags detection complete:', matched);
  return matched;
}

export function detectWebSockets(html: string): boolean {
  console.log('[PatternDetection] Starting WebSocket detection');
  const matched = WEBSOCKET_PATTERNS.some(({ pattern }) => {
    const result = pattern.test(html);
    if (result) {
      console.log('[PatternDetection] WebSocket pattern matched:', pattern.toString());
      // Log the matching content
      const match = html.match(pattern);
      if (match) {
        console.log('[PatternDetection] Matched content:', match[0]);
      }
    }
    return result;
  });
  console.log('[PatternDetection] WebSocket detection complete:', matched);
  return matched;
}

export function getDetailedMatches(html: string): PatternMatch[] {
  console.log('[PatternDetection] Starting detailed pattern matching');
  const allPatterns = [
    ...DYNAMIC_PATTERNS,
    ...ELEMENT_PATTERNS,
    ...META_PATTERNS,
    ...WEBSOCKET_PATTERNS
  ];

  const matches = allPatterns.filter(({ pattern }) => {
    const result = pattern.test(html);
    if (result) {
      const match = html.match(pattern);
      console.log('[PatternDetection] Pattern matched:', {
        pattern: pattern.toString(),
        matchedContent: match ? match[0] : 'No match content available'
      });
    }
    return result;
  });

  console.log('[PatternDetection] Detailed pattern matching complete. Found matches:', matches.length);
  return matches;
}
