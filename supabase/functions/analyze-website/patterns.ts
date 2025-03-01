
/**
 * Chatbot detection patterns for various chat platforms and solutions
 */

// Common chatbot platforms
export const CHATBOT_PATTERNS = {
  'Intercom': [
    /intercom/i,
    /intercomcdn/i,
    /intercom-frame/i,
    /intercom-container/i,
    /intercom\.com\/messenger/i
  ],
  'Drift': [
    /drift/i,
    /driftt/i,
    /js\.driftt\.com/i,
    /drift-frame/i,
    /driftt\.com/i
  ],
  'Zendesk Chat': [
    /zopim/i,
    /zendesk/i,
    /zdassets/i,
    /zd-chat/i,
    /zdchat/i,
    /static\.zdassets\.com/i,
    /ekr\.zdassets\.com/i
  ],
  'Crisp': [
    /crisp/i,
    /crisp-client/i,
    /client\.crisp\.chat/i,
    /crisp-widget/i
  ],
  'LiveChat': [
    /livechat/i,
    /livechatinc/i,
    /cdn\.livechatinc\.com/i,
    /livechat-widget/i
  ],
  'Tawk.to': [
    /tawk/i,
    /tawk\.to/i,
    /embed\.tawk\.to/i,
    /tawk-widget/i
  ],
  'HubSpot Chat': [
    /hubspot/i,
    /js\.hs-scripts\.com/i,
    /js\.hsforms\.net/i,
    /js\.usemessages\.com/i,
    /hubspot-messages-iframe/i
  ],
  'Tidio': [
    /tidio/i,
    /tidiochat/i,
    /code\.tidio\.co/i,
    /tidio-chat/i
  ],
  'LivePerson': [
    /liveperson/i,
    /lpcdn/i,
    /lptag/i,
    /liveperson\.net/i
  ],
  'Olark': [
    /olark/i,
    /olark-frame/i,
    /static\.olark\.com/i
  ],
  'Freshchat': [
    /freshchat/i,
    /wchat\.freshchat\.com/i,
    /freshbots/i,
    /freshworks/i
  ],
  'ChatBot': [
    /chatbot/i,
    /chatbotui/i,
    /chatbot-container/i
  ],
  'ManyChat': [
    /manychat/i,
    /mc\.manychat\.com/i
  ],
  'Chaport': [
    /chaport/i,
    /chaport-container/i,
    /app\.chaport\.com/i
  ],
  'Jivochat': [
    /jivo/i,
    /jivosite/i,
    /jivo_container/i,
    /cdn\.jivochat\.com/i,
    /jivosite\.com/i
  ],
  'Facebook Messenger Chat': [
    /fb-messenger/i,
    /facebook\.com\/plugins\/customerchat/i,
    /messenger-plugin/i,
    /facebook-jssdk/i,
    /fb-customerchat/i,
    /\.facebook\.com\/v[\d.]+\/plugins\/customerchat/i
  ],
  'Website Chatbot': [
    /chat-window/i,
    /chatwidget/i,
    /chat-bot/i,
    /chat-container/i,
    /chat-bubble/i,
    /bot-avatar/i,
    /chat-?bot/i,
    /support-?chat/i,
    /live-?chat/i,
    /chat-?support/i,
    /chat-?widget/i
  ]
};

// Count total patterns for confidence calculation
export const TOTAL_PATTERNS = Object.values(CHATBOT_PATTERNS)
  .reduce((sum, patterns) => sum + patterns.length, 0);

// Check if text contains an invitation to chat
export const CHAT_INVITATION_PATTERNS = [
  /chat\s+with\s+us/i,
  /start\s+a\s+chat/i,
  /live\s+chat/i,
  /chat\s+now/i,
  /chat\s+support/i,
  /message\s+us/i,
  /talk\s+to\s+us/i,
  /get\s+in\s+touch/i
];

// Functions to interact with the patterns
export function getAllPatterns(): Record<string, RegExp[]> {
  return CHATBOT_PATTERNS;
}

export function getPatternsByProvider(provider: string): RegExp[] | undefined {
  return CHATBOT_PATTERNS[provider];
}
