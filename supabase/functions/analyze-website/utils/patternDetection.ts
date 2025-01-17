export function detectDynamicLoading(html: string): boolean {
  const dynamicPatterns = [
    /window\.(onload|addEventListener).*chat/i,
    /document\.(ready|addEventListener).*chat/i,
    /loadChat|initChat|startChat|chatInit/i,
    /chat.*widget.*load/i,
    /load.*chat.*widget/i,
    /init.*chat.*widget/i,
    /chat.*messenger.*load/i,
    /load.*chat.*messenger/i,
    /init.*chat.*messenger/i,
    /chat.*bot.*load/i,
    /load.*chat.*bot/i,
    /init.*chat.*bot/i
  ];
  
  return dynamicPatterns.some(pattern => pattern.test(html));
}

export function detectChatElements(html: string): boolean {
  const elementPatterns = [
    /<div[^>]*(?:chat|messenger|support|bot)[^>]*>/i,
    /<iframe[^>]*(?:chat|messenger|support|bot)[^>]*>/i,
    /<button[^>]*(?:chat|messenger|support|bot)[^>]*>/i,
    /<script[^>]*(?:chat|messenger|support|bot)[^>]*>/i,
    /<link[^>]*(?:chat|messenger|support|bot)[^>]*>/i
  ];

  return elementPatterns.some(pattern => pattern.test(html));
}

export function detectMetaTags(html: string): boolean {
  const metaPatterns = [
    /<meta[^>]*(?:chat|messenger|support|bot)[^>]*>/i,
    /chat.*config/i,
    /messenger.*config/i,
    /bot.*config/i,
    /chatbot.*config/i,
    /chat.*settings/i,
    /messenger.*settings/i,
    /bot.*settings/i
  ];

  return metaPatterns.some(pattern => pattern.test(html));
}

export function detectWebSockets(html: string): boolean {
  const wsPatterns = [
    /new WebSocket.*chat/i,
    /WebSocket.*messenger/i,
    /ws.*chat/i,
    /wss.*chat/i,
    /socket.*chat/i,
    /chat.*socket/i
  ];

  return wsPatterns.some(pattern => pattern.test(html));
}