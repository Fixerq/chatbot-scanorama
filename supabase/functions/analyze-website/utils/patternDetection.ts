
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
    // Enhanced patterns for dynamic loading
    /window\.onload\s*=\s*function.*?\{.*?chat/is,
    /\$\(document\)\.ready\(function.*?\{.*?chat/is,
    /document\.addEventListener\(['"]DOMContentLoaded['"]/i,
    /setTimeout\(.*?chat/i,
    /new\s+ChatWidget|new\s+ChatBot|new\s+ChatInterface/i
  ];
  
  return dynamicPatterns.some(pattern => pattern.test(html));
}

export function detectChatElements(html: string): boolean {
  const elementPatterns = [
    /<div[^>]*(?:chat|messenger|support|bot)[^>]*>/i,
    /<iframe[^>]*(?:chat|messenger|support|bot)[^>]*>/i,
    /<button[^>]*(?:chat|messenger|support|bot)[^>]*>/i,
    /<script[^>]*(?:chat|messenger|support|bot)[^>]*>/i,
    /<link[^>]*(?:chat|messenger|support|bot)[^>]*>/i,
    // Enhanced patterns for chat elements
    /<input[^>]*(?:chat-input|message-input)[^>]*>/i,
    /<textarea[^>]*(?:chat-input|message-input)[^>]*>/i,
    /<div[^>]*(?:chat-container|chat-window|chat-widget|chat-box)[^>]*>/i,
    /<div[^>]*(?:message-container|messages-list|chat-messages)[^>]*>/i,
    /<button[^>]*(?:send-message|submit-chat|chat-send)[^>]*>/i,
    /<div[^>]*(?:chat-header|chat-footer|chat-body)[^>]*>/i,
    /<div[^>]*(?:chat-bubble|message-bubble|chat-message)[^>]*>/i
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
    /bot.*settings/i,
    // Enhanced patterns for meta tags and configurations
    /chatbot_?id|chat_?widget_?id|messenger_?id/i,
    /chat_?app_?id|support_?widget_?id/i,
    /chat.*configuration|chat.*settings|chat.*options/i,
    /widget.*configuration|widget.*settings|widget.*options/i,
    /chatSettings|chatOptions|chatConfig|widgetSettings/i,
    /CHAT_API_KEY|CHAT_TOKEN|MESSENGER_TOKEN/i
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
    // Enhanced patterns for websockets
    /socket\.io.*chat/i,
    /io\.connect.*chat/i,
    /pusher.*chat/i,
    /firebase.*chat/i,
    /signalr.*chat/i,
    /socketUrl|socketEndpoint|wsUrl|wsEndpoint/i,
    /chat.*connection|messenger.*connection/i,
    /connection.*chat|connection.*messenger/i
  ];

  return wsPatterns.some(pattern => pattern.test(html));
}

// Additional verification methods

export function detectChatFunctionality(html: string): boolean {
  const functionalityPatterns = [
    // Input fields for messaging
    /<input[^>]*(?:message|chat|send)[^>]*>/i,
    /<textarea[^>]*(?:message|chat)[^>]*>/i,
    
    // Send buttons
    /<button[^>]*(?:send|submit)[^>]*>(?:.*?send|.*?submit|.*?chat)/i,
    
    // Message containers
    /<div[^>]*(?:messages-container|chat-messages|message-list)[^>]*>/i,
    
    // Chat UI structure
    /<div[^>]*(?:chat-header|chat-footer|chat-body)[^>]*>/i,
    
    // Message formatting
    /<div[^>]*(?:message-bubble|chat-bubble|user-message|agent-message)[^>]*>/i
  ];
  
  return functionalityPatterns.some(pattern => pattern.test(html));
}

export function detectChatInitialization(html: string): boolean {
  const initPatterns = [
    /initChat|startChat|loadChat|setupChat|createChat/i,
    /chat\.init|chat\.start|chat\.load|chat\.setup/i,
    /new\s+Chat(?:Widget|Bot|Interface|App)/i,
    /chat(?:Widget|Bot|Interface|App)\.init/i,
    /widget\.init|widget\.start|widget\.load/i,
    /messenger\.init|messenger\.start|messenger\.load/i,
    /bot\.init|bot\.start|bot\.load/i,
    /initMessenger|startMessenger|loadMessenger/i
  ];
  
  return initPatterns.some(pattern => pattern.test(html));
}
