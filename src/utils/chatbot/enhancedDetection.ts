
/**
 * Enhanced chatbot detection with multi-level verification
 * This module provides browser-based detection logic that can be used
 * by the edge function for more accurate chatbot identification
 */

/**
 * Performs enhanced chatbot detection with multiple verification layers
 * @param page - The browser page object (from Puppeteer/Playwright)
 */
export const detectChatbotEnhanced = async (page: any) => {
  // Collect evidence points rather than making a binary decision
  let chatbotScore = 0;
  let evidenceCollected: string[] = [];
  
  // Check for common chatbot DOM structures with higher specificity
  const chatbotElements = await page.$$([
    // Common chatbot containers
    'iframe[title*="chat" i]',
    'div[aria-label*="chat" i]',
    'button[aria-label*="chat" i]',
    // Intercom specific
    'div.intercom-lightweight-app',
    // Drift specific
    'div[data-testid="widgetButton"]',
    // Zendesk specific
    'div.zEWidget-launcher',
    // Crisp specific
    'div.crisp-client',
    // LiveChat specific
    'div#chat-widget-container',
    // Tawk.to specific
    'iframe[title*="tawk" i]'
  ].join(','));
  
  if (chatbotElements.length > 0) {
    chatbotScore += 3;
    evidenceCollected.push('Found potential chatbot DOM elements');
  }
  
  // Check for chatbot-specific scripts
  const chatbotScripts = await page.$$([
    'script[src*="intercom"]',
    'script[src*="drift"]',
    'script[src*="zendesk"]',
    'script[src*="crisp.chat"]',
    'script[src*="livechat"]',
    'script[src*="tawk.to"]',
    'script[src*="chatbot"]',
    'script[src*="liveperson"]',
    'script[src*="helpscout"]',
    'script[src*="freshchat"]'
  ].join(','));
  
  if (chatbotScripts.length > 0) {
    chatbotScore += 4;
    evidenceCollected.push('Found chatbot provider scripts');
  }
  
  // Look for visible chatbot elements (not hidden)
  const visibleChatElements = await page.$$eval([
    'button:not([style*="display: none"]):not([style*="visibility: hidden"])[aria-label*="chat" i]',
    'div:not([style*="display: none"]):not([style*="visibility: hidden"])[aria-label*="chat" i]'
  ].join(','), (elements: any[]) => elements.length);
  
  if (visibleChatElements > 0) {
    chatbotScore += 2;
    evidenceCollected.push('Found visible chat elements');
  }
  
  // False positive check: filter out static contact elements
  const contactForms = await page.$$('form[action*="contact"]');
  if (contactForms.length > 0 && chatbotScore < 5) {
    chatbotScore -= 2;
    evidenceCollected.push('Possible false positive: Found contact form');
  }
  
  // Check for actual chat functionality vs static elements
  const hasInteractiveChat = await page.evaluate(() => {
    // Look for interactive chat elements
    return window.getComputedStyle(document.body).getPropertyValue('--intercom-color') !== '' || 
           document.querySelector('div[aria-live="polite"][role="log"]') !== null ||
           document.querySelector('div[role="dialog"][aria-labelledby*="chat"]') !== null;
  });
  
  if (hasInteractiveChat) {
    chatbotScore += 3;
    evidenceCollected.push('Found interactive chat elements');
  }
  
  // Final determination with confidence level
  let confidence = 'low';
  if (chatbotScore >= 7) confidence = 'high';
  else if (chatbotScore >= 4) confidence = 'medium';
  
  const hasChatbot = chatbotScore >= 4;
  
  return {
    hasChatbot,
    confidence,
    score: chatbotScore,
    evidence: evidenceCollected,
    provider: determineProvider(evidenceCollected)
  };
};

/**
 * Helper function to determine the likely chatbot provider based on evidence
 * @param evidence - Array of evidence strings collected during detection
 */
export const determineProvider = (evidence: string[]): string => {
  const providerSignatures: Record<string, string[]> = {
    'Intercom': ['intercom', 'intercom-lightweight-app'],
    'Drift': ['drift', 'data-testid="widgetButton"'],
    'Zendesk': ['zendesk', 'zEWidget'],
    'Crisp': ['crisp.chat', 'crisp-client'],
    'LiveChat': ['livechat', 'chat-widget-container'],
    'Tawk.to': ['tawk.to'],
    'Hubspot': ['hubspot', 'HubSpotConversations'],
    'Freshchat': ['freshchat'],
    'Custom': []
  };
  
  // Find matching provider
  for (const [provider, signatures] of Object.entries(providerSignatures)) {
    if (signatures.some(sig => evidence.some(e => e.includes(sig)))) {
      return provider;
    }
  }
  
  return 'Unknown';
};

/**
 * Extracts enhanced detection results into a format compatible with the app's needs
 * @param detectionResult - The result from detectChatbotEnhanced
 */
export const formatEnhancedDetectionResult = (detectionResult: any): { 
  chatSolutions: string[],
  confidence: number,
  verificationStatus: 'verified' | 'unverified' | 'failed' | 'unknown'
} => {
  // Convert the string confidence to numeric value for the app
  let confidenceValue = 0;
  switch (detectionResult.confidence) {
    case 'high':
      confidenceValue = 0.9;
      break;
    case 'medium':
      confidenceValue = 0.7;
      break;
    case 'low':
      confidenceValue = 0.3;
      break;
    default:
      confidenceValue = 0.1;
  }
  
  // Transform provider to chatSolutions array format
  const chatSolutions = [];
  if (detectionResult.hasChatbot) {
    if (detectionResult.provider === 'Unknown' || detectionResult.provider === 'Custom') {
      chatSolutions.push('Website Chatbot');
    } else {
      chatSolutions.push(detectionResult.provider);
    }
  }
  
  // Determine verification status
  let verificationStatus: 'verified' | 'unverified' | 'failed' | 'unknown' = 'unknown';
  if (detectionResult.hasChatbot) {
    verificationStatus = detectionResult.confidence === 'high' ? 'verified' : 'unverified';
  } else {
    verificationStatus = 'failed';
  }
  
  return {
    chatSolutions,
    confidence: confidenceValue,
    verificationStatus
  };
};

// Export types for enhanced detection
export interface EnhancedDetectionResult {
  hasChatbot: boolean;
  confidence: string;
  score: number;
  evidence: string[];
  provider: string;
}
