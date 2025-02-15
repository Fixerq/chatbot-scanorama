
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
  /chatbot/i
].map(pattern => ({ pattern, type: 'dynamic' }));

const ELEMENT_PATTERNS = [
  /<(?:div|iframe|button|script|link|img|span)[^>]*(?:chat|messenger|support|bot|widget|engage)[^>]*>/i,
  /class=["'][^"']*(?:chat|messenger|support|bot|widget)[^"']*["']/i,
  /id=["'][^"']*(?:chat|messenger|support|bot|widget)[^"']*["']/i,
  /data-(?:chat|messenger|support|widget|bot)[^=]*=["'][^"']*["']/i,
  /botmanager/i,
  /webchat/i,
  /messageus/i,
  /chatbot/i
].map(pattern => ({ pattern, type: 'element' }));

const META_PATTERNS = [
  /<meta[^>]*(?:chat|messenger|support|bot|widget)[^>]*>/i,
  /(?:chat|messenger|bot|widget|engage).*(?:config|settings)/i,
  /(?:config|settings).*(?:chat|messenger|bot|widget|engage)/i,
  /botmanager/i,
  /webchat/i,
  /messageus/i,
  /chatbot/i
].map(pattern => ({ pattern, type: 'meta' }));

const WEBSOCKET_PATTERNS = [
  /(?:new WebSocket|WebSocket\.).*(?:chat|messenger|widget|engage)/i,
  /(?:ws|wss):\/\/[^"']*(?:chat|messenger|widget|engage)[^"']*/i,
  /(?:socket|websocket).*(?:chat|messenger|widget|engage)/i,
  /(?:chat|messenger|widget|engage).*(?:socket|websocket)/i,
  /botmanager/i,
  /webchat/i,
  /messageus/i,
  /chatbot/i
].map(pattern => ({ pattern, type: 'websocket' }));

interface PatternMatch {
  pattern: RegExp;
  type: 'dynamic' | 'element' | 'meta' | 'websocket';
  matched?: string;
}

export function detectDynamicLoading(html: string): boolean {
  const matched = DYNAMIC_PATTERNS.some(({ pattern }) => {
    const result = pattern.test(html);
    if (result) {
      console.log('[PatternDetection] Dynamic pattern matched:', pattern);
    }
    return result;
  });
  console.log('[PatternDetection] Dynamic loading detected:', matched);
  return matched;
}

export function detectChatElements(html: string): boolean {
  const matched = ELEMENT_PATTERNS.some(({ pattern }) => {
    const result = pattern.test(html);
    if (result) {
      console.log('[PatternDetection] Element pattern matched:', pattern);
    }
    return result;
  });
  console.log('[PatternDetection] Chat elements detected:', matched);
  return matched;
}

export function detectMetaTags(html: string): boolean {
  const matched = META_PATTERNS.some(({ pattern }) => {
    const result = pattern.test(html);
    if (result) {
      console.log('[PatternDetection] Meta pattern matched:', pattern);
    }
    return result;
  });
  console.log('[PatternDetection] Meta tags detected:', matched);
  return matched;
}

export function detectWebSockets(html: string): boolean {
  const matched = WEBSOCKET_PATTERNS.some(({ pattern }) => {
    const result = pattern.test(html);
    if (result) {
      console.log('[PatternDetection] WebSocket pattern matched:', pattern);
    }
    return result;
  });
  console.log('[PatternDetection] WebSocket usage detected:', matched);
  return matched;
}

export function getDetailedMatches(html: string): PatternMatch[] {
  const allPatterns = [
    ...DYNAMIC_PATTERNS,
    ...ELEMENT_PATTERNS,
    ...META_PATTERNS,
    ...WEBSOCKET_PATTERNS
  ];

  const matches = allPatterns.filter(({ pattern }) => {
    const result = pattern.test(html);
    if (result) {
      console.log('[PatternDetection] Pattern matched:', pattern);
    }
    return result;
  });

  console.log('[PatternDetection] Total matches found:', matches.length);
  return matches;
}
