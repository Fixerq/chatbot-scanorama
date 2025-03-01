
// Utility functions for pattern-based detection

// Detect if the website uses dynamic loading of scripts that could be chat-related
export const detectDynamicLoading = (html: string): boolean => {
  const dynamicLoadingPatterns = [
    /dynamically\s+load(?:ed|ing)?\s+(?:chat|support|widget)/i,
    /loadScript\(\s*['"](?:.*chat|.*messenger|.*support)/i,
    /document\.createElement\(['"]script['"]\)[^}]+(?:chat|support|messenger)/i,
    /window\.addEventListener\(['"]load['"],[^}]+(?:chat|support|messenger)/i
  ];
  
  return dynamicLoadingPatterns.some(pattern => pattern.test(html));
};

// Detect if the website has HTML elements commonly used for chat interfaces
export const detectChatElements = (html: string): boolean => {
  const chatElementPatterns = [
    /<div[^>]*(?:chat-container|chat-widget|chat-window|chatbox|chat-frame|chat-button)/i,
    /<div[^>]*(?:class|id)=["'](?:.*chat.*|.*support.*|.*messenger.*)["']/i,
    /<iframe[^>]*(?:chat|support|messenger|widget)/i,
    /<button[^>]*(?:chat|support|help|contact)/i
  ];
  
  return chatElementPatterns.some(pattern => pattern.test(html));
};

// Detect if the website has meta tags that might indicate a chat solution
export const detectMetaTags = (html: string): boolean => {
  const metaTagPatterns = [
    /<meta[^>]*content=["'].*(?:chat|support|messenger).*["']/i,
    /<meta[^>]*name=["'](?:chat|support|messenger).*["']/i,
    /<meta[^>]*property=["'].*:(?:chat|messenger).*["']/i
  ];
  
  return metaTagPatterns.some(pattern => pattern.test(html));
};

// Detect if the website uses WebSockets (common for real-time chat)
export const detectWebSockets = (html: string): boolean => {
  const webSocketPatterns = [
    /WebSocket\(/i,
    /new\s+WebSocket/i,
    /\.connect\(\s*["']wss?:/i,
    /socket\.io/i,
    /pusher/i,
    /firebase/i,
    /SignalR/i
  ];
  
  return webSocketPatterns.some(pattern => pattern.test(html));
};
