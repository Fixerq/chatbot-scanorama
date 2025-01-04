export const analyzeContent = (html: string): string[] => {
  const chatSolutions: string[] = [];
  
  const CHAT_PATTERNS = {
    'Intercom': [/intercom/i, /widget\.intercom\.io/i],
    'Drift': [/drift\.com/i, /js\.driftt\.com/i, /drift-frame/i],
    'Zendesk': [/zopim/i, /zendesk/i, /zdassets\.com/i],
    'Crisp': [/crisp\.chat/i, /client\.crisp\.chat/i],
    'LiveChat': [/livechat/i, /livechatinc\.com/i],
    'Tawk.to': [/tawk\.to/i, /embed\.tawk\.to/i],
    'HubSpot': [/hubspot/i, /js\.hs-scripts\.com/i],
    'Facebook Messenger': [/facebook\.com\/customer_chat/i, /connect\.facebook\.net.*\/sdk\/xfbml\.customerchat/i],
    'WhatsApp': [/wa\.me/i, /whatsapp/i, /api\.whatsapp\.com/i],
    'Custom Chat': [/chat-widget/i, /chat-container/i, /chat-box/i, /messenger-widget/i]
  };

  for (const [solution, patterns] of Object.entries(CHAT_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(html))) {
      chatSolutions.push(solution);
    }
  }

  return chatSolutions;
};
