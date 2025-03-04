
/**
 * Advanced chatbot detection with provider-specific signatures
 * Provides a more accurate detection mechanism with stricter validation
 */

// Known chatbot providers and their specific signatures
export const chatbotProviders = {
  'Intercom': {
    domElements: ['div.intercom-lightweight-app', '#intercom-container', 'iframe[name*="intercom"]'],
    scripts: ['intercom-cdn', 'intercom.js', 'api.intercom.io', 'widget.intercom.io'],
    globals: ['Intercom', 'intercomSettings'],
  },
  'Drift': {
    domElements: ['div[data-testid="widgetButton"]', '.drift-widget-container', 'iframe[id*="drift"]'],
    scripts: ['js.driftt.com', 'drift.js', 'driftt.com'],
    globals: ['drift', 'driftt'],
  },
  'Zendesk': {
    domElements: ['div.zEWidget-launcher', 'iframe#webWidget', '.zEWidget', 'div[data-brand*="zendesk"]'],
    scripts: ['static.zdassets.com', 'web_widget', 'zendesk', 'zopim'],
    globals: ['zE', 'zESettings', '$zopim'],
  },
  'Crisp': {
    domElements: ['div.crisp-client', 'span.crisp-button', '#crisp-chatbox', '.crisp-'],
    scripts: ['client.crisp.chat', 'crisp.js', 'crisp.chat'],
    globals: ['$crisp', 'CRISP_WEBSITE_ID', 'CRISP_TOKEN_ID'],
  },
  'LiveChat': {
    domElements: ['div#chat-widget-container', '[data-lc-event]', 'iframe[title*="livechat"]', '#livechat'],
    scripts: ['cdn.livechatinc.com', 'livechat.js', 'livechatinc.com'],
    globals: ['LiveChatWidget', 'LC_API', '__lc'],
  },
  'Tawk.to': {
    domElements: ['iframe[title*="tawk" i]', '#tawkchat-container', '#tawk-', '.tawk-'],
    scripts: ['embed.tawk.to', 'tawk.js', 'tawk.to'],
    globals: ['Tawk_API', 'tawkto'],
  },
  'HubSpot': {
    domElements: ['div#hubspot-messages-iframe-container', '[data-hubspot]', 'iframe[data-test-id="chat-widget-iframe"]'],
    scripts: ['js.hs-scripts.com', 'js.usemessages.com', 'js.hubspotfeedback.com', 'hubspot'],
    globals: ['HubSpotConversations', 'hsConversationsSettings', '_hsq'],
  },
  'Freshchat': {
    domElements: ['div#freshchat-container', '#fc_frame', '#freshchat', '.freshchat'],
    scripts: ['wchat.freshchat.com', 'freshchat.js', 'freshbots', 'freshworks'],
    globals: ['fcWidget', 'Freshchat', 'freshchat_agent'],
  },
  'Olark': {
    domElements: ['div#olark-box-container', '#habla_', '.olark-'],
    scripts: ['static.olark.com', 'olark.js', 'olark.identify'],
    globals: ['olark', 'olarkIdentify'],
  },
  'LivePerson': {
    domElements: ['div#lpChat', 'iframe#lpChatWidget', '[data-lp-', '.lp-chat-'],
    scripts: ['lptag.liveperson.net', 'lpcdn.lpsnmedia.net', 'liveperson'],
    globals: ['lpTag', 'lpMTagConfig', 'lpProtocol'],
  },
  'Tidio': {
    domElements: ['iframe#tidio-chat', '.tidio-', '#tidio-'],
    scripts: ['code.tidio.co', 'tidio.js', 'tidio.co'],
    globals: ['tidioChatApi', 'tidioIdentify', 'tidioChatCode'],
  },
  'Facebook Customer Chat': {
    domElements: ['.fb-customerchat', 'div[class*="fb_customer"]', 'iframe[title*="facebook"]', '.fb_iframe_widget'],
    scripts: ['connect.facebook.net', 'facebook.com/plugins/customerchat', 'facebook-jssdk'],
    globals: ['FB', 'fbAsyncInit'],
  },
  'Chaport': {
    domElements: ['.chaport-container', '.chaport-window', '#chaport-widget'],
    scripts: ['chaport.com', 'app.chaport.com'],
    globals: ['chaport', 'Chaport'],
  },
  'JivoChat': {
    domElements: ['#jivo-iframe-container', '.jivo-', '#jcont'],
    scripts: ['code.jivosite.com', 'jivosite.com', 'jivo.js'],
    globals: ['jivo_api', 'jivo_config', 'jivo_init'],
  },
  'Help Scout': {
    domElements: ['.beacon-container', '#beacon-container', '.Beacon-'],
    scripts: ['beacon-v2.helpscout.net', 'helpscout.net'],
    globals: ['Beacon', 'BeaconInit', 'HS'],
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
