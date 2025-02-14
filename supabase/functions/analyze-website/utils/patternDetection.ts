
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
    /init.*chat.*bot/i,
    /widget.*load/i,
    /load.*widget/i,
    /messenger.*init/i,
    /bot.*init/i,
    /engage.*init/i
  ];
  
  return dynamicPatterns.some(pattern => pattern.test(html));
}

export function detectChatElements(html: string): boolean {
  const elementPatterns = [
    /<div[^>]*(?:chat|messenger|support|bot|widget|engage)[^>]*>/i,
    /<iframe[^>]*(?:chat|messenger|support|bot|widget|engage)[^>]*>/i,
    /<button[^>]*(?:chat|messenger|support|bot|widget|engage)[^>]*>/i,
    /<script[^>]*(?:chat|messenger|support|bot|widget|engage)[^>]*>/i,
    /<link[^>]*(?:chat|messenger|support|bot|widget|engage)[^>]*>/i,
    /<img[^>]*(?:chat|messenger|support|bot|widget)[^>]*>/i,
    /<span[^>]*(?:chat|messenger|support|bot|widget)[^>]*>/i,
    /class="[^"]*(?:chat|messenger|support|bot|widget)[^"]*"/i,
    /id="[^"]*(?:chat|messenger|support|bot|widget)[^"]*"/i
  ];

  return elementPatterns.some(pattern => pattern.test(html));
}

export function detectMetaTags(html: string): boolean {
  const metaPatterns = [
    /<meta[^>]*(?:chat|messenger|support|bot|widget)[^>]*>/i,
    /chat.*config/i,
    /messenger.*config/i,
    /bot.*config/i,
    /chatbot.*config/i,
    /chat.*settings/i,
    /messenger.*settings/i,
    /bot.*settings/i,
    /widget.*config/i,
    /widget.*settings/i,
    /engage.*config/i,
    /engage.*settings/i
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
    /chat.*socket/i,
    /websocket.*widget/i,
    /ws.*widget/i,
    /wss.*widget/i,
    /socket.*widget/i,
    /widget.*socket/i,
    /engage.*websocket/i,
    /websocket.*engage/i
  ];

  return wsPatterns.some(pattern => pattern.test(html));
}
