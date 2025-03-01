
import { CHAT_PATTERNS, FALSE_POSITIVE_PATTERNS, FALSE_POSITIVE_DOMAINS } from '../patterns';

interface DetectionResult {
  hasChatbot: boolean;
  solutions: string[];
  matchedPatterns: Record<string, number>;
  confidence: number;
  verificationStatus: 'verified' | 'unverified' | 'failed';
}

// Check for actual chat functionality indicators in the HTML
const hasActualChatFunctionality = (html: string): boolean => {
  const chatFunctionalityPatterns = [
    // Input areas typically found in chat interfaces
    /<input[^>]*(?:message|chat|send)[^>]*>/i,
    /<textarea[^>]*(?:message|chat)[^>]*>/i,
    
    // Send buttons in chat interfaces
    /<button[^>]*(?:send|submit)[^>]*>(?:.*?send|.*?submit|.*?chat)/i,
    
    // Message bubbles or containers
    /<div[^>]*(?:message-bubble|message-container|chat-bubble|chat-message)[^>]*>/i,
    
    // Typical chat interface structure
    /<div[^>]*(?:chat-header|chat-footer|chat-body|messages-container)[^>]*>/i,
    
    // Chat avatar or user icon patterns
    /<(?:img|div)[^>]*(?:avatar|user-icon|chat-icon)[^>]*>/i
  ];
  
  return chatFunctionalityPatterns.some(pattern => pattern.test(html));
};

// Check for chat initialization code in JavaScript
const hasChatInitialization = (html: string): boolean => {
  const chatInitPatterns = [
    // Common chat initialization patterns
    /(?:init|initialize|load|start)(?:Chat|Messenger|Bot|Support)/i,
    /chat(?:Widget|Bot|Support|Agent|App)\.(?:init|load|start)/i,
    /new\s+Chat(?:Widget|Bot|Interface|App)/i,
    /(?:chat|messenger|support|widget)\.(?:init|initialize|start|load)/i,
    
    // Event listeners for chat interfaces
    /addEventListener\(['"](load|DOMContentLoaded)['"],\s*function.*?chat/i
  ];
  
  return chatInitPatterns.some(pattern => pattern.test(html));
};

// Check for chat configuration objects
const hasChatConfiguration = (html: string): boolean => {
  const chatConfigPatterns = [
    // Chat configuration objects
    /(?:chat|messenger|bot|widget)Config\s*=/i,
    /(?:chat|messenger|bot|widget)Settings\s*=/i,
    /(?:chat|messenger|bot|widget)Options\s*=/i,
    /window\.(?:chat|messenger|bot|widget)(?:Config|Settings|Options)\s*=/i,
    
    // JSON-like configuration objects
    /{[^}]*(?:chatbot|widgetId|agentId|supportId)[^}]*}/i
  ];
  
  return chatConfigPatterns.some(pattern => pattern.test(html));
};

// Inspect for chat UI elements
const hasChatUIElements = (html: string): boolean => {
  const chatUIPatterns = [
    // Chat UI containers
    /<div[^>]*(?:chat-container|chat-widget|chat-window|chat-panel|chat-box|messenger-container)[^>]*>/i,
    
    // Chat buttons or launchers
    /<(?:button|div|a)[^>]*(?:chat-button|chat-launcher|chat-icon|chat-trigger|open-chat)[^>]*>/i,
    
    // Chat iframe or embedded interfaces
    /<iframe[^>]*(?:chat|messenger|support)[^>]*>/i
  ];
  
  return chatUIPatterns.some(pattern => pattern.test(html));
};

// Match vendor-specific patterns
const matchVendorPatterns = (html: string, url: string): {matches: Record<string, number>, hasMatch: boolean} => {
  const matches: Record<string, number> = {};
  let hasMatch = false;
  
  // Check domain against known false positives
  const domain = new URL(url).hostname;
  const isFalsePositiveDomain = FALSE_POSITIVE_DOMAINS.some(d => 
    domain.includes(d) || domain === d
  );
  
  if (isFalsePositiveDomain) {
    return { matches: {}, hasMatch: false };
  }
  
  // Check content against known false positive patterns
  const contentHasFalsePositivePattern = FALSE_POSITIVE_PATTERNS.some(pattern => 
    pattern.test(html)
  );
  
  // If we find too many false positive indicators, be more conservative
  const falsePositiveThreshold = contentHasFalsePositivePattern ? 3 : 2;
  
  Object.entries(CHAT_PATTERNS).forEach(([vendor, patterns]) => {
    // Count how many patterns match
    let matchCount = 0;
    patterns.forEach(pattern => {
      if (pattern.test(html)) {
        matchCount++;
      }
    });
    
    // Only consider it a match if we have enough pattern matches
    // Be more strict for "Website Chatbot" to avoid false positives
    const requiredMatches = vendor === 'Website Chatbot' ? falsePositiveThreshold : 1;
    
    if (matchCount >= requiredMatches) {
      matches[vendor] = matchCount;
      hasMatch = true;
    }
  });
  
  return { matches, hasMatch };
};

// Calculate confidence based on multiple factors
const calculateConfidence = (
  vendorMatches: Record<string, number>,
  hasChat: boolean,
  hasInit: boolean,
  hasConfig: boolean,
  hasUI: boolean
): number => {
  let score = 0;
  const maxScore = 10;
  
  // Vendor-specific patterns (0-4 points)
  const totalVendorMatches = Object.values(vendorMatches).reduce((sum, count) => sum + count, 0);
  const vendorTypes = Object.keys(vendorMatches).length;
  
  // More weight to specific vendor matches than generic ones
  if (vendorTypes > 0) {
    // Penalize if the only match is "Website Chatbot" with few pattern matches
    if (vendorTypes === 1 && vendorMatches['Website Chatbot'] && vendorMatches['Website Chatbot'] < 3) {
      score += 1; // Lower confidence for only generic matches
    } else {
      // Higher confidence for specific vendor matches
      score += Math.min(4, totalVendorMatches / 2);
    }
  }
  
  // Chat functionality (0-2 points)
  if (hasChat) {
    score += 2;
  }
  
  // Initialization code (0-1.5 points)
  if (hasInit) {
    score += 1.5;
  }
  
  // Configuration (0-1.5 points)
  if (hasConfig) {
    score += 1.5;
  }
  
  // UI elements (0-1 point)
  if (hasUI) {
    score += 1;
  }
  
  // Normalize to 0-1 range
  return Math.min(score / maxScore, 1);
};

// Determine if it's a false positive
const isFalsePositive = (html: string, url: string): boolean => {
  try {
    // Check domain against known false positives
    const domain = new URL(url).hostname;
    if (FALSE_POSITIVE_DOMAINS.some(d => domain.includes(d) || domain === d)) {
      return true;
    }
    
    // Check if content has too many false positive indicators
    const falsePositiveMatches = FALSE_POSITIVE_PATTERNS.filter(pattern => pattern.test(html)).length;
    if (falsePositiveMatches >= 2) {
      return true;
    }
    
    return false;
  } catch (e) {
    console.error('Error checking for false positives:', e);
    return false;
  }
};

export const smartDetectChatbot = (html: string, url: string): DetectionResult => {
  try {
    // Quick check for false positives
    if (isFalsePositive(html, url)) {
      return {
        hasChatbot: false,
        solutions: [],
        matchedPatterns: {},
        confidence: 0,
        verificationStatus: 'verified'
      };
    }
    
    // Match against vendor-specific patterns
    const { matches, hasMatch } = matchVendorPatterns(html, url);
    
    // Check for actual chat functionality
    const hasChatFunctionality = hasActualChatFunctionality(html);
    
    // Check for chat initialization code
    const hasInitCode = hasChatInitialization(html);
    
    // Check for chat configuration
    const hasConfigObj = hasChatConfiguration(html);
    
    // Check for chat UI elements
    const hasUiElements = hasChatUIElements(html);
    
    // Calculate confidence score
    const confidence = calculateConfidence(
      matches,
      hasChatFunctionality,
      hasInitCode,
      hasConfigObj,
      hasUiElements
    );
    
    // Determine verification status
    let verificationStatus: 'verified' | 'unverified' | 'failed' = 'unverified';
    if (confidence >= 0.75) {
      verificationStatus = 'verified';
    } else if (confidence < 0.3) {
      verificationStatus = 'failed';
    }
    
    // Determine chat solutions based on matches
    let solutions: string[] = [];
    if (confidence >= 0.5) {
      solutions = Object.keys(matches).sort((a, b) => matches[b] - matches[a]);
    }
    
    return {
      hasChatbot: confidence >= 0.5 && solutions.length > 0,
      solutions,
      matchedPatterns: matches,
      confidence,
      verificationStatus
    };
  } catch (e) {
    console.error('Error in smart chatbot detection:', e);
    return {
      hasChatbot: false,
      solutions: [],
      matchedPatterns: {},
      confidence: 0,
      verificationStatus: 'failed'
    };
  }
};
