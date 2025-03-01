
/**
 * Advanced chatbot detection utilizing heuristics and AI techniques
 */

// Signs that indicate a high likelihood of chatbot presence
const HIGH_CONFIDENCE_INDICATORS = [
  /<div[^>]*\blivechat\b/i,
  /<div[^>]*\bchat-?bot\b/i,
  /<div[^>]*\bchatbot\b/i,
  /<div[^>]*\bchat-?(window|widget|box|container)\b/i,
  /chat-?bot\s*is\s*(typing|thinking)/i,
  /start\s*live\s*chat/i,
  /chat\s*with\s*(us|expert|agent|team|support)/i
];

// Keywords often associated with chatbots but require additional verification
const CHATBOT_KEYWORDS = [
  'assistance',
  'automated',
  'bot',
  'chat',
  'conversation',
  'help',
  'instant',
  'live',
  'message',
  'question',
  'response',
  'service',
  'support'
];

/**
 * Performs smart detection of chatbots beyond simple pattern matching
 */
export function performSmartDetection(html: string): {
  isLikelyChatbot: boolean;
  confidence: number;
  indicators: string[];
} {
  if (!html) {
    return { isLikelyChatbot: false, confidence: 0, indicators: [] };
  }
  
  // Search for high confidence indicators
  const highConfidenceMatches = HIGH_CONFIDENCE_INDICATORS.some(pattern => 
    pattern.test(html)
  );
  
  // Count keyword occurrences
  const keywordCounts = CHATBOT_KEYWORDS.reduce((counts, keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = html.match(regex);
    counts[keyword] = matches ? matches.length : 0;
    return counts;
  }, {} as Record<string, number>);
  
  // Calculate total keyword density
  const totalKeywords = Object.values(keywordCounts).reduce((sum, count) => sum + count, 0);
  const textLength = html.length;
  const keywordDensity = textLength > 0 ? totalKeywords / (textLength / 1000) : 0;
  
  // Identify chat elements in the DOM
  const chatElements = [
    html.includes('chat-window'),
    html.includes('chat-container'),
    html.includes('chat-widget'),
    html.includes('livechat'),
    html.includes('bot-container')
  ].filter(Boolean).length;
  
  // Determine if chatbot is likely present
  const isLikelyChatbot = highConfidenceMatches || 
    (keywordDensity > 1.5 && chatElements >= 1) ||
    chatElements >= 2;
  
  // Calculate confidence score
  let confidence = 0;
  if (highConfidenceMatches) {
    confidence = 0.9; // High confidence if direct indicators are found
  } else if (chatElements >= 2) {
    confidence = 0.8; // Multiple chat elements suggest a chatbot
  } else if (chatElements === 1 && keywordDensity > 1.5) {
    confidence = 0.7; // One chat element with high keyword density
  } else if (keywordDensity > 2) {
    confidence = 0.6; // Very high keyword density alone
  } else if (keywordDensity > 1) {
    confidence = 0.4; // Moderate keyword density
  }
  
  // Collect indicators for the result
  const indicators = [];
  if (highConfidenceMatches) indicators.push('High confidence patterns');
  if (chatElements > 0) indicators.push(`${chatElements} chat UI elements`);
  if (keywordDensity > 0.8) indicators.push(`Keyword density: ${keywordDensity.toFixed(2)}`);
  
  return {
    isLikelyChatbot,
    confidence,
    indicators
  };
}

/**
 * Checks if a URL is likely to be a false positive based on domain/content
 */
export function isFalsePositive(url: string, html: string): boolean {
  // List of domains known to trigger false positives
  const falsePositiveDomains = [
    'example.com',
    'test.com',
    'dentist',
    'dental'
  ];
  
  // Check domain against known false positives
  const domainMatch = falsePositiveDomains.some(domain => url.includes(domain));
  
  // Check HTML content for indicators that this is a dental or healthcare site
  // but not actually having a chatbot
  const isDentalSite = /dental|dentist|orthodont/i.test(html) && 
    !/(chat.*now|start.*chat|live.*chat)/i.test(html);
  
  return domainMatch || isDentalSite;
}
