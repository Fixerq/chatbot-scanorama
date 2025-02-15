
// Pre-compiled patterns for better performance
const DYNAMIC_PATTERNS = [
  /window\.(onload|addEventListener).*chat/i,
  /document\.(ready|addEventListener).*chat/i,
  /(?:loadChat|initChat|startChat|chatInit|initializeChat)/i,
  /(?:chat|messenger|support|bot|widget|engage).*(?:load|init|start)/i,
  /(?:load|init|start).*(?:chat|messenger|support|bot|widget|engage)/i
].map(pattern => ({ pattern, type: 'dynamic' as const }));

const ELEMENT_PATTERNS = [
  /<(?:div|iframe|button|script|link|img|span)[^>]*(?:chat|messenger|support|bot|widget|engage)[^>]*>/i,
  /class=["'][^"']*(?:chat|messenger|support|bot|widget)[^"']*["']/i,
  /id=["'][^"']*(?:chat|messenger|support|bot|widget)[^"']*["']/i,
  /data-(?:chat|messenger|support|widget|bot)[^=]*=["'][^"']*["']/i
].map(pattern => ({ pattern, type: 'element' as const }));

const META_PATTERNS = [
  /<meta[^>]*(?:chat|messenger|support|bot|widget)[^>]*>/i,
  /(?:chat|messenger|bot|widget|engage).*(?:config|settings)/i,
  /(?:config|settings).*(?:chat|messenger|bot|widget|engage)/i
].map(pattern => ({ pattern, type: 'meta' as const }));

const WEBSOCKET_PATTERNS = [
  /(?:new WebSocket|WebSocket\.).*(?:chat|messenger|widget|engage)/i,
  /(?:ws|wss):\/\/[^"']*(?:chat|messenger|widget|engage)[^"']*/i,
  /(?:socket|websocket).*(?:chat|messenger|widget|engage)/i,
  /(?:chat|messenger|widget|engage).*(?:socket|websocket)/i
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
  return DYNAMIC_PATTERNS.some(({ pattern }) => pattern.test(html));
}

/**
 * Detects chat-related elements in HTML content
 * @param html - The HTML content to analyze
 * @returns boolean indicating if chat elements were found
 */
export function detectChatElements(html: string): boolean {
  return ELEMENT_PATTERNS.some(({ pattern }) => pattern.test(html));
}

/**
 * Detects chat-related meta tags and configurations
 * @param html - The HTML content to analyze
 * @returns boolean indicating if meta tags were found
 */
export function detectMetaTags(html: string): boolean {
  return META_PATTERNS.some(({ pattern }) => pattern.test(html));
}

/**
 * Detects WebSocket usage for chat functionality
 * @param html - The HTML content to analyze
 * @returns boolean indicating if WebSocket patterns were found
 */
export function detectWebSockets(html: string): boolean {
  return WEBSOCKET_PATTERNS.some(({ pattern }) => pattern.test(html));
}

/**
 * Gets detailed pattern matches with their types
 * @param html - The HTML content to analyze
 * @returns Array of pattern matches with their types
 */
export function getDetailedMatches(html: string): PatternMatch[] {
  const allPatterns = [
    ...DYNAMIC_PATTERNS,
    ...ELEMENT_PATTERNS,
    ...META_PATTERNS,
    ...WEBSOCKET_PATTERNS
  ];

  return allPatterns.filter(({ pattern }) => pattern.test(html));
}

