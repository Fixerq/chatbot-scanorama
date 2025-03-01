
/**
 * Advanced detection of chatbots using heuristics and AI-like pattern recognition
 */

// Common chat-related keywords
const CHAT_KEYWORDS = [
  'chat', 'message', 'support', 'help', 'assistant', 'bot', 'ai', 
  'conversation', 'talk', 'agent', 'live help', 'contact us'
];

// Chat interaction patterns often found in HTML/JS
const CHAT_INTERACTION_PATTERNS = [
  /chat[-_]?widget/i,
  /chat[-_]?bot/i,
  /chat[-_]?window/i,
  /chat[-_]?bubble/i,
  /livechat/i,
  /live[-_]?chat/i,
  /messenger/i,
  /chat[-_]?icon/i,
  /support[-_]?chat/i,
  /chat[-_]?container/i,
  /chat[-_]?frame/i,
  /chat[-_]?launcher/i,
  /chat[-_]?button/i,
];

// Chat functionality indicators in JavaScript
const JS_CHAT_INDICATORS = [
  /initChat/i,
  /loadChat/i,
  /startChat/i,
  /openChat/i,
  /chat\.init/i,
  /chat\.open/i,
  /ChatWindow/i,
  /ChatWidget/i,
  /ChatBot/i,
  /bot\.init/i,
  /chat\.show/i,
  /showChat/i,
];

// Known false positive domains
const FALSE_POSITIVE_DOMAINS = [
  'kentdentists.com',
  'privategphealthcare.com',
  'dentalcaredirect.co.uk',
  'mydentist.co.uk',
  'dentist-special.com'
];

/**
 * Check if a URL is in the false positive list
 */
export function isFalsePositive(url: string, html: string): boolean {
  try {
    // Check domain against known false positives
    const domain = new URL(url).hostname;
    const isFalseDomain = FALSE_POSITIVE_DOMAINS.some(falseDomain => 
      domain.includes(falseDomain) || domain === falseDomain
    );
    
    if (isFalseDomain) {
      return true;
    }
    
    // Additional checks could be added here
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Performs smart detection of chatbot presence using multiple heuristics
 */
export function performSmartDetection(html: string): { 
  isLikelyChatbot: boolean; 
  confidence: number;
  indicators: string[];
} {
  if (!html || typeof html !== 'string') {
    return { isLikelyChatbot: false, confidence: 0, indicators: [] };
  }
  
  const indicators: string[] = [];
  let score = 0;
  
  // Check for chat-related HTML elements
  const chatElements = CHAT_INTERACTION_PATTERNS.filter(pattern => pattern.test(html));
  if (chatElements.length > 0) {
    indicators.push(`Found ${chatElements.length} chat-related HTML elements`);
    score += Math.min(chatElements.length * 0.15, 0.45); // Cap at 0.45
  }
  
  // Check for chat keywords in visible text
  const lowercaseHtml = html.toLowerCase();
  const foundKeywords = CHAT_KEYWORDS.filter(keyword => 
    lowercaseHtml.includes(keyword.toLowerCase())
  );
  
  if (foundKeywords.length > 0) {
    indicators.push(`Found ${foundKeywords.length} chat-related keywords`);
    score += Math.min(foundKeywords.length * 0.05, 0.25); // Cap at 0.25
  }
  
  // Check for chat functionality in JavaScript
  const jsIndicators = JS_CHAT_INDICATORS.filter(pattern => pattern.test(html));
  if (jsIndicators.length > 0) {
    indicators.push(`Found ${jsIndicators.length} chat-related JavaScript functions`);
    score += Math.min(jsIndicators.length * 0.1, 0.3); // Cap at 0.3
  }
  
  // Look for chat interaction elements like textareas, input fields with chat-related attributes
  const hasChatInput = /<(input|textarea)[^>]+(chat|message)[^>]+(type=["']text["']|placeholder)/i.test(html);
  if (hasChatInput) {
    indicators.push('Found chat input field');
    score += 0.2;
  }
  
  // Check for chat invitation texts
  const chatInvitation = /chat\s+with\s+us|start\s+a\s+chat|live\s+chat|chat\s+now|message\s+us/i.test(html);
  if (chatInvitation) {
    indicators.push('Found chat invitation text');
    score += 0.15;
  }
  
  // Look for common chatbot UI elements
  const hasChatUI = /<div[^>]+(chat-message|message-bubble|chat-bubble|bot-message|user-message)[^>]*>/i.test(html);
  if (hasChatUI) {
    indicators.push('Found chatbot UI elements');
    score += 0.25;
  }
  
  // Normalize score to a confidence value between 0 and 1
  const confidence = Math.min(score, 1);
  
  return {
    isLikelyChatbot: confidence >= 0.5,
    confidence,
    indicators
  };
}
