
// Pre-compiled patterns for better performance
const DYNAMIC_PATTERNS = [
  /window\.(onload|addEventListener).*chat/i,
  /document\.(ready|addEventListener).*chat/i,
  /(?:loadChat|initChat|startChat|chatInit|initializeChat)/i,
  /(?:chat|messenger|support|bot|widget|engage).*(?:load|init|start)/i,
  /(?:load|init|start).*(?:chat|messenger|support|bot|widget|engage)/i,
  /chatbot.*init/i,
  /init.*chatbot/i,
  /messaging.*init/i,
  /init.*messaging/i,
  /livechat.*init/i,
  /init.*livechat/i,
  /support.*init/i,
  /init.*support/i,
  /bot.*init/i,
  /init.*bot/i,
  /widget.*load/i,
  /load.*widget/i,
  /livechat.*load/i,
  /load.*livechat/i,
  /support.*load/i,
  /load.*support/i,
  /chatbox.*init/i,
  /init.*chatbox/i
].map(pattern => ({ pattern, type: 'dynamic' as const }));

const ELEMENT_PATTERNS = [
  /<(?:div|iframe|button|script|link|img|span)[^>]*(?:chat|messenger|support|bot|widget|engage)[^>]*>/i,
  /class=["'][^"']*(?:chat|messenger|support|bot|widget)[^"']*["']/i,
  /id=["'][^"']*(?:chat|messenger|support|bot|widget)[^"']*["']/i,
  /data-(?:chat|messenger|support|widget|bot)[^=]*=["'][^"']*["']/i,
  /<script[^>]*(?:chat|messenger|support|bot|widget|livechat)[^>]*>/i,
  /<div[^>]*(?:chat|messenger|support|bot|widget|livechat)[^>]*>/i,
  /<iframe[^>]*(?:chat|messenger|support|bot|widget|livechat)[^>]*>/i,
  /<button[^>]*(?:chat|messenger|support|bot|widget|livechat)[^>]*>/i,
  /chat-widget/i,
  /chat-container/i,
  /chat-box/i,
  /chat-frame/i,
  /chat-button/i,
  /chat-messenger/i,
  /chat-popup/i,
  /chat-window/i,
  /chat-launcher/i,
  /chat-trigger/i,
  /messenger-frame/i,
  /messenger-widget/i,
  /support-widget/i,
  /support-chat/i,
  /help-widget/i,
  /help-chat/i,
  /customer-support/i,
  /live-support/i,
  /live-chat/i,
  /chatbot/i,
  /chat-bot/i,
  /bot-widget/i,
  /livechat/i,
  /tawk-messenger/i,
  /zendesk-chat/i,
  /intercom-container/i,
  /drift-widget/i,
  /crisp-client/i,
  /messenger-button/i,
  /fb-messenger/i,
  /whatsapp-widget/i,
  /gorgias-chat/i,
  /freshchat/i,
  /hubspot-messages/i,
  /olark-chat/i,
  /purechat/i,
  /tidio-chat/i,
  /chat-tools/i,
  /chat-interface/i,
  /chat-application/i
].map(pattern => ({ pattern, type: 'element' as const }));

const META_PATTERNS = [
  /<meta[^>]*(?:chat|messenger|support|bot|widget)[^>]*>/i,
  /(?:chat|messenger|bot|widget|engage).*(?:config|settings)/i,
  /(?:config|settings).*(?:chat|messenger|bot|widget|engage)/i,
  /<meta[^>]*livechat[^>]*>/i,
  /<meta[^>]*chatbot[^>]*>/i,
  /<meta[^>]*support-widget[^>]*>/i,
  /<meta[^>]*messenger[^>]*>/i,
  /chat.*configuration/i,
  /configuration.*chat/i,
  /messenger.*configuration/i,
  /configuration.*messenger/i,
  /bot.*configuration/i,
  /configuration.*bot/i,
  /widget.*configuration/i,
  /configuration.*widget/i,
  /livechat.*settings/i,
  /settings.*livechat/i,
  /chatbot.*settings/i,
  /settings.*chatbot/i,
  /support.*settings/i,
  /settings.*support/i
].map(pattern => ({ pattern, type: 'meta' as const }));

const WEBSOCKET_PATTERNS = [
  /(?:new WebSocket|WebSocket\.).*(?:chat|messenger|widget|engage)/i,
  /(?:ws|wss):\/\/[^"']*(?:chat|messenger|widget|engage)[^"']*/i,
  /(?:socket|websocket).*(?:chat|messenger|widget|engage)/i,
  /(?:chat|messenger|widget|engage).*(?:socket|websocket)/i,
  /ws:\/\/.*chat/i,
  /wss:\/\/.*chat/i,
  /socket\.io.*chat/i,
  /chat.*socket\.io/i,
  /websocket.*messenger/i,
  /messenger.*websocket/i,
  /ws:\/\/.*support/i,
  /wss:\/\/.*support/i,
  /ws:\/\/.*livechat/i,
  /wss:\/\/.*livechat/i,
  /socket.*chatbot/i,
  /chatbot.*socket/i,
  /websocket.*widget/i,
  /widget.*websocket/i
].map(pattern => ({ pattern, type: 'websocket' as const }));

interface PatternMatch {
  pattern: RegExp;
  type: 'dynamic' | 'element' | 'meta' | 'websocket';
  matched?: string;
}

export function detectDynamicLoading(html: string): boolean {
  try {
    console.log('[PatternDetection] Starting dynamic loading detection');
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

export function detectChatElements(html: string): boolean {
  try {
    console.log('[PatternDetection] Starting chat elements detection');
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

export function detectMetaTags(html: string): boolean {
  try {
    console.log('[PatternDetection] Starting meta tags detection');
    const matched = META_PATTERNS.some(({ pattern }) => {
      const result = pattern.test(html);
      if (result) {
        const match = html.match(pattern);
        console.log('[PatternDetection] Meta pattern matched:', {
          pattern: pattern.toString(),
          matchedContent: match ? match[0] : 'No match content'
        });
      }
      return result;
    });
    console.log('[PatternDetection] Meta tags detection complete:', matched);
    return matched;
  } catch (error) {
    console.error('[PatternDetection] Error in detectMetaTags:', error);
    return false;
  }
}

export function detectWebSockets(html: string): boolean {
  try {
    console.log('[PatternDetection] Starting WebSocket detection');
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

