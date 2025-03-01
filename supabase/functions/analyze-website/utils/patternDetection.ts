
/**
 * Utility functions for pattern-based detection of chat elements
 */

// Detect dynamic loading of scripts or chat elements
export const detectDynamicLoading = (html: string): boolean => {
  const dynamicLoadingPatterns = [
    /loadChatWidget/i,
    /initializeChat/i,
    /loadChat/i,
    /onload.*chat/i,
    /widget\.load/i,
    /load.*widget/i,
    /async.*chat/i,
    /defer.*chat/i,
    /chatbot.*load/i,
    /window\.addEventListener.*chat/i
  ];
  
  return dynamicLoadingPatterns.some(pattern => pattern.test(html));
};

// Detect common chat elements in HTML structure
export const detectChatElements = (html: string): boolean => {
  const chatElementPatterns = [
    /<div[^>]*chat/i,
    /<button[^>]*chat/i,
    /<iframe[^>]*chat/i,
    /<div[^>]*messenger/i,
    /<div[^>]*support-widget/i,
    /<div[^>]*customer-support/i,
    /<button[^>]*talk-to-us/i,
    /<div[^>]*livechat/i
  ];
  
  return chatElementPatterns.some(pattern => pattern.test(html));
};

// Detect meta tags that might indicate chatbot presence
export const detectMetaTags = (html: string): boolean => {
  const metaTagPatterns = [
    /<meta[^>]*chatbot/i,
    /<meta[^>]*livechat/i,
    /<meta[^>]*customer-support/i,
    /<meta[^>]*messenger/i,
    /<meta[^>]*intercom/i,
    /<meta[^>]*drift/i,
    /<meta[^>]*tawk/i,
    /<meta[^>]*zendesk/i,
    /<meta[^>]*crisp/i
  ];
  
  return metaTagPatterns.some(pattern => pattern.test(html));
};

// Detect websocket connections often used by chat widgets
export const detectWebSockets = (html: string): boolean => {
  const webSocketPatterns = [
    /WebSocket/i,
    /wss:\/\//i,
    /ws:\/\//i,
    /socket\.io/i,
    /websocket/i,
    /realtime/i,
    /pusher/i,
    /socket-connection/i
  ];
  
  return webSocketPatterns.some(pattern => pattern.test(html));
};
