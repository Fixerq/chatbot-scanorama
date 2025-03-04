
/**
 * Advanced detection of chatbots using heuristics and AI-like pattern recognition
 */

// Common chat-related keywords
const CHAT_KEYWORDS = [
  'chat', 'message', 'support', 'help', 'assistant', 'bot', 'ai', 
  'conversation', 'talk', 'agent', 'live help', 'contact us', 'talk to us',
  'virtual assistant', 'hello', 'can I help', 'ask us', 'need assistance',
  'customer support', 'service agent', 'chat with us', 'get support'
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
  /chat[-_]?panel/i,
  /chat[-_]?header/i,
  /chat[-_]?footer/i,
  /chat[-_]?body/i,
  /chat[-_]?module/i,
  /chat[-_]?app/i,
  /ai[-_]?assistant/i,
  /virtual[-_]?assistant/i,
  /support[-_]?agent/i,
  /chat[-_]?agent/i,
  /helpdesk/i,
  /help[-_]?desk/i,
  /get[-_]?help/i,
  /ask[-_]?question/i
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
  /chatbot/i,
  /launchChat/i,
  /toggleChat/i,
  /initBot/i,
  /assistantInit/i,
  /setupChat/i,
  /connectChat/i,
  /loadChatWidget/i,
  /createChatWidget/i,
  /renderChatWindow/i,
  /initializeChat/i
];

// Known false positive domains
const FALSE_POSITIVE_DOMAINS = [
  'kentdentists.com',
  'privategphealthcare.com',
  'dentalcaredirect.co.uk',
  'mydentist.co.uk',
  'dentist-special.com',
  'firstgroupliverpool.co.uk'
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
    
    // Additional false positive check: dental websites often have "chat" related to dental procedures
    if ((domain.includes('dent') || domain.includes('dental')) && 
        !html.includes('livechat') && 
        !html.includes('intercom') && 
        !html.includes('zendesk') &&
        !html.includes('crisp') &&
        !html.includes('drift') &&
        !html.includes('tawk')) {
      return true;
    }
    
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
  
  // Check for chat-related HTML elements - more weight on these
  const chatElements = CHAT_INTERACTION_PATTERNS.filter(pattern => pattern.test(html));
  if (chatElements.length > 0) {
    indicators.push(`Found ${chatElements.length} chat-related HTML elements`);
    score += Math.min(chatElements.length * 0.18, 0.5); // Cap at 0.5, but higher weight
  }
  
  // Check for chat keywords in visible text
  const lowercaseHtml = html.toLowerCase();
  const foundKeywords = CHAT_KEYWORDS.filter(keyword => 
    lowercaseHtml.includes(keyword.toLowerCase())
  );
  
  if (foundKeywords.length > 0) {
    indicators.push(`Found ${foundKeywords.length} chat-related keywords`);
    score += Math.min(foundKeywords.length * 0.06, 0.3); // Cap at 0.3, slightly higher
  }
  
  // Check for chat functionality in JavaScript - higher weight on these
  const jsIndicators = JS_CHAT_INDICATORS.filter(pattern => pattern.test(html));
  if (jsIndicators.length > 0) {
    indicators.push(`Found ${jsIndicators.length} chat-related JavaScript functions`);
    score += Math.min(jsIndicators.length * 0.12, 0.4); // Cap at 0.4, higher weight
  }
  
  // Look for chat interaction elements like textareas, input fields with chat-related attributes
  const hasChatInput = /<(input|textarea)[^>]+(chat|message)[^>]+(type=["']text["']|placeholder)/i.test(html);
  if (hasChatInput) {
    indicators.push('Found chat input field');
    score += 0.25; // Higher weight
  }
  
  // Check for chat invitation texts - more emphasis
  const chatInvitation = /chat\s+with\s+us|start\s+a\s+chat|live\s+chat|chat\s+now|message\s+us|talk\s+to\s+us|get\s+help|need\s+assistance/i.test(html);
  if (chatInvitation) {
    indicators.push('Found chat invitation text');
    score += 0.3; // Higher impact
  }
  
  // Look for common chatbot UI elements - strong indicator
  const hasChatUI = /<div[^>]+(chat-message|message-bubble|chat-bubble|bot-message|user-message|chat-header|chat-footer)[^>]*>/i.test(html);
  if (hasChatUI) {
    indicators.push('Found chatbot UI elements');
    score += 0.35; // Higher impact
  }
  
  // Look for chatbot icons and SVGs - often indicate chat capabilities
  const hasChatIcons = /<(svg|img)[^>]+(chat|message|support)[^>]+(class|alt|title|id)[^>]*>/i.test(html);
  if (hasChatIcons) {
    indicators.push('Found chat-related icons');
    score += 0.2; // Medium impact
  }
  
  // Check for persistent floating buttons which often trigger chat
  const hasFloatingButtons = /<(button|div)[^>]+(fixed|absolute)[^>]+(bottom|right|corner)[^>]*>/i.test(html) &&
                            (lowercaseHtml.includes('help') || lowercaseHtml.includes('chat') || 
                             lowercaseHtml.includes('support') || lowercaseHtml.includes('message'));
  if (hasFloatingButtons) {
    indicators.push('Found floating action buttons that may trigger chat');
    score += 0.15; // Moderate impact
  }
  
  // Look for iframe-based chat solutions
  const hasIframeChat = /<iframe[^>]+(chat|support|messaging|assistant)[^>]*>/i.test(html);
  if (hasIframeChat) {
    indicators.push('Found iframe-based chat solution');
    score += 0.25; // Higher impact
  }
  
  // Normalize score to a confidence value between 0 and 1
  const confidence = Math.min(score, 1);
  
  return {
    isLikelyChatbot: confidence >= 0.4, // More permissive threshold
    confidence,
    indicators
  };
}
