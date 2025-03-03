
/**
 * Advanced chatbot detection with provider-specific signatures
 * Provides a more accurate detection mechanism with stricter validation
 */

// Known chatbot providers and their specific signatures
export const chatbotProviders = {
  'Intercom': {
    domElements: ['div.intercom-lightweight-app', '#intercom-container'],
    scripts: ['intercom-cdn', 'intercom.js', 'api.intercom.io'],
    globals: ['Intercom', 'intercomSettings'],
  },
  'Drift': {
    domElements: ['div[data-testid="widgetButton"]', 'drift-widget-container'],
    scripts: ['js.driftt.com', 'drift.js'],
    globals: ['drift', 'driftt'],
  },
  'Zendesk': {
    domElements: ['div.zEWidget-launcher', 'iframe#webWidget'],
    scripts: ['static.zdassets.com', 'web_widget'],
    globals: ['zE', 'zESettings'],
  },
  'Crisp': {
    domElements: ['div.crisp-client', 'span.crisp-button'],
    scripts: ['client.crisp.chat', 'crisp.js'],
    globals: ['$crisp', 'CRISP_WEBSITE_ID'],
  },
  'LiveChat': {
    domElements: ['div#chat-widget-container', '[data-lc-event]'],
    scripts: ['cdn.livechatinc.com', 'livechat.js'],
    globals: ['LiveChatWidget', 'LC_API'],
  },
  'Tawk.to': {
    domElements: ['iframe[title*="tawk" i]', '#tawkchat-container'],
    scripts: ['embed.tawk.to', 'tawk.js'],
    globals: ['Tawk_API', 'tawkto'],
  },
  'HubSpot': {
    domElements: ['div#hubspot-messages-iframe-container'],
    scripts: ['js.hs-scripts.com', 'js.usemessages.com'],
    globals: ['HubSpotConversations', 'hsConversationsSettings'],
  },
  'Freshchat': {
    domElements: ['div#freshchat-container'],
    scripts: ['wchat.freshchat.com', 'freshchat.js'],
    globals: ['fcWidget', 'Freshchat'],
  },
  'Olark': {
    domElements: ['div#olark-box-container'],
    scripts: ['static.olark.com', 'olark.js'],
    globals: ['olark', 'olarkIdentify'],
  },
  'LivePerson': {
    domElements: ['div#lpChat', 'iframe#lpChatWidget'],
    scripts: ['lptag.liveperson.net', 'lpcdn.lpsnmedia.net'],
    globals: ['lpTag', 'lpMTagConfig'],
  }
};

/**
 * Formats the advanced detection result into a standardized format
 */
export const formatAdvancedDetectionResult = (result: any) => {
  return {
    hasChatbot: result.hasChatbot,
    confidence: result.confidence || 'none',
    evidence: result.evidence || [],
    provider: result.provider || 'None',
    falsePositiveChecks: result.falsePositiveChecks || [],
    providerScore: result.providerScore
  };
};

/**
 * Helper function to determine confidence level based on evidence and checks
 */
export const determineConfidenceLevel = (
  evidenceCount: number, 
  falsePositiveChecks: string[]
): 'high' | 'medium' | 'low' | 'none' => {
  if (falsePositiveChecks.length > 0) return 'low';
  if (evidenceCount >= 7) return 'high';
  if (evidenceCount >= 4) return 'medium';
  if (evidenceCount >= 2) return 'low';
  return 'none';
};
