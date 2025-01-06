export const chatbotPatterns = [
  // Common chat platforms
  /intercom/i,
  /drift/i,
  /zendesk/i,
  /livechat/i,
  /freshchat/i,
  /crisp/i,
  /tawk/i,
  /tidio/i,
  /olark/i,
  /helpscout/i,
  /chatbot/i,
  /messenger/i,
  /liveperson/i,
  /hubspot/i,
  /chatwoot/i,
  /kommunicate/i,
  /botpress/i,
  /rasa/i,
  /dialogflow/i,
  /manychat/i,
  /chatfuel/i,
  /mobilemonkey/i,
  /botsify/i,
  /pandorabots/i,
  /motion\.ai/i,
  /flowxo/i,
  /chatrace/i,
  /collect\.chat/i,
  /gorgias/i,
  /userlike/i,
  /pure\s*chat/i,
  /chatra/i,
  /smartsupp/i,
  /jivochat/i,
  /livechatinc/i,
  /snapengage/i,
  /iadvize/i,
  /acquire/i,
  /chaport/i,
  /kayako/i,
  /helpcrunch/i,
  /chat\s*widget/i,
  /chat\s*bot/i,
  /live\s*chat/i,
  /customer\s*support\s*chat/i,
  /chat\s*support/i,
  // Common chat HTML elements and classes
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
  // Common chat script patterns
  /widget\.js.*chat/i,
  /chat.*widget\.js/i,
  /chat.*messenger/i,
  /messenger.*chat/i,
  // Facebook specific
  /facebook.*customerchat/i,
  /fb.*customerchat/i,
  /facebook.*messenger/i,
  // WhatsApp specific
  /whatsapp.*chat/i,
  /wa\.me/i,
  /whatsapp.*button/i,
  // Generic chat indicators
  /data-.*chat/i,
  /chat.*plugin/i,
  /chat.*sdk/i,
  /chat.*api/i,
  /chat.*integration/i,
  // Common chat service domains
  /\.chat\./i,
  /chat\..*\.com/i,
  /\.tawk\.to/i,
  /\.crisp\.chat/i,
  /\.gorgias\./i,
  /\.intercom\./i,
  /\.drift\./i,
  /\.zendesk\./i,
  /\.freshchat\./i,
  /\.livechat\./i,
  /\.tidio\./i,
  /\.olark\./i,
  /\.helpscout\./i,
  /\.messenger\./i,
  /\.liveperson\./i,
  /\.hubspot\./i,
  /\.chatwoot\./i,
  /\.kommunicate\./i,
  /\.botpress\./i,
  /\.dialogflow\./i,
  /\.manychat\./i,
  /\.chatfuel\./i,
  /\.mobilemonkey\./i,
  /\.botsify\./i,
  /\.pandorabots\./i,
  /\.flowxo\./i,
  /\.chatrace\./i,
  /\.collect\.chat/i,
  /\.userlike\./i,
  /\.purechat\./i,
  /\.chatra\./i,
  /\.smartsupp\./i,
  /\.jivochat\./i,
  /\.snapengage\./i,
  /\.iadvize\./i,
  /\.acquire\./i,
  /\.chaport\./i,
  /\.kayako\./i,
  /\.helpcrunch\./i,
  // Dynamic loading patterns
  /loadChat/i,
  /initChat/i,
  /startChat/i,
  /chatInit/i,
  /chat-init/i,
  /chat_init/i,
  // Common chat button and container IDs
  /#chat-widget/i,
  /#chat-container/i,
  /#chat-button/i,
  /#livechat/i,
  /#chat-box/i,
  // Additional chat-related classes
  /\.chat-widget/i,
  /\.chat-container/i,
  /\.chat-button/i,
  /\.livechat/i,
  /\.chat-box/i,
  // Common third-party chat services
  /elfsight/i,
  /gist\.build/i,
  /chaty/i,
  /zoho.*chat/i,
  /zoho.*salesiq/i,
  /\.zoho\./i,
  /callpage/i,
  /chatterpal/i,
  /chatsdk/i,
  /chat-sdk/i,
  /chat_sdk/i,
  // Additional chat indicators
  /support-chat/i,
  /chat-support/i,
  /live-chat/i,
  /chat-live/i,
  /chat_live/i,
  /chat-bubble/i,
  /chat_bubble/i,
  /chat-icon/i,
  /chat_icon/i,
  // Additional common chat services
  /tidiochat/i,
  /smartsuppchat/i,
  /jivosite/i,
  /gorgias-chat/i,
  /freshworks/i,
  /freshdesk/i,
  /tawkto/i,
  /tawk-messenger/i,
  /chatnox/i,
  /chatra-iframe/i,
  /chat-bubble/i,
  /chat-toggle/i,
  /chat-notification/i,
  /chat-online/i,
  /chat-offline/i,
  /chat-away/i,
  /chat-busy/i,
  /chat-status/i,
  // Common chat elements
  /div[^>]*chat/i,
  /iframe[^>]*chat/i,
  /button[^>]*chat/i,
  /span[^>]*chat/i,
  /a[^>]*chat/i,
  // Chat loading scripts
  /chat.*loader/i,
  /loader.*chat/i,
  /chat.*initialize/i,
  /initialize.*chat/i,
  /chat.*bootstrap/i,
  /bootstrap.*chat/i,
  // Chat configuration patterns
  /chat.*config/i,
  /config.*chat/i,
  /chat.*settings/i,
  /settings.*chat/i,
  // Chat event listeners
  /chat.*event/i,
  /event.*chat/i,
  /chat.*listener/i,
  /listener.*chat/i
];

export const hasChatbotScript = (html: string): boolean => {
  if (!html) return false;

  // First check for common chat elements in the HTML structure
  const hasCommonChatElements = /<div[^>]*(?:chat|messenger|support)[^>]*>/.test(html) ||
    /<iframe[^>]*(?:chat|messenger|support)[^>]*>/.test(html) ||
    /<button[^>]*(?:chat|messenger|support)[^>]*>/.test(html);

  // Check for chat-related scripts and links
  const hasScriptOrLink = /<(?:script|link)[^>]*(?:chat|messenger|support)[^>]*>/.test(html);

  // Check for specific chat platform patterns
  const hasChatPlatform = chatbotPatterns.some(pattern => pattern.test(html));

  // Check for dynamic loading patterns
  const hasDynamicLoading = /window\.(onload|addEventListener).*chat/i.test(html) ||
    /document\.(ready|addEventListener).*chat/i.test(html);

  // Check for common chat-related meta tags
  const hasMetaTags = /<meta[^>]*(?:chat|messenger|support)[^>]*>/.test(html);

  // Check for chat-related data attributes
  const hasDataAttributes = /data-(?:chat|messenger|support|widget)/i.test(html);

  // Check for chat-related comments
  const hasComments = /<!--.*(?:chat|messenger|support).*-->/i.test(html);

  // Check for chat-related JSON configuration
  const hasJsonConfig = /{[^}]*(?:chat|messenger|support)[^}]*}/i.test(html);

  // Return true if any of the checks pass
  return hasCommonChatElements || 
         hasScriptOrLink || 
         hasChatPlatform || 
         hasDynamicLoading || 
         hasMetaTags ||
         hasDataAttributes ||
         hasComments ||
         hasJsonConfig;
};