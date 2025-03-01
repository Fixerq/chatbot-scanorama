
// Define patterns for chatbot detection
export const CHAT_PATTERNS = {
  'Intercom': [
    /intercom/i,
    /widget\.intercom\.io/i,
    /intercomcdn/i,
    /intercom-frame/i,
    /intercom-container/i,
    /intercom-messenger/i,
    /intercom-launcher/i,
    /intercom-notifications/i
  ],
  'Drift': [
    /drift\.com/i,
    /js\.driftt\.com/i,
    /drift-frame/i,
    /driftt/i,
    /drift-widget/i,
    /drift-conductor-url/i,
    /drift-iframe-controller/i,
    /drift-chat/i
  ],
  'Zendesk': [
    /zopim/i,
    /zendesk/i,
    /zdassets\.com/i,
    /zd-message/i,
    /zd-chat/i,
    /zdchat/i,
    /web_widget/i,
    /zopim\.com/i,
    /zopim2/i,
    /zopim-chat/i
  ],
  'Crisp': [
    /crisp\.chat/i,
    /client\.crisp\.chat/i,
    /crisp-client/i,
    /crispWebsiteId/i,
    /crisp-widget/i,
    /crisp-box/i,
    /crisp-container/i,
    /CRISP_WEBSITE_ID/i
  ],
  'LiveChat': [
    /livechat/i,
    /livechatinc\.com/i,
    /LiveChatWidget/i,
    /lc_settings/i,
    /__lc/i,
    /livechat-compact/i,
    /livechat-floating/i,
    /livechat-frame/i
  ],
  'Tawk.to': [
    /tawk\.to/i,
    /embed\.tawk\.to/i,
    /tawkto/i,
    /Tawk_API/i,
    /tawk-messenger/i,
    /tawk-chat/i,
    /tawk-iframe/i
  ],
  'HubSpot': [
    /hubspot/i,
    /js\.hs-scripts\.com/i,
    /HubSpotConversations/i,
    /hubspot-messages-iframe/i,
    /hs-chat/i,
    /conversations-widget/i,
    /hubspot-conversations-iframe/i,
    /hubspot-messaging/i,
    /hs-messaging/i,
    /hs-messenger/i
  ],
  'Facebook Messenger': [
    /facebook\.com\/customer_chat/i,
    /connect\.facebook\.net.*\/sdk\/xfbml\.customerchat/i,
    /fb-messenger-widget/i,
    /fb-customerchat/i,
    /FacebookMessenger/i,
    /messenger-checkbox/i,
    /messenger-widget/i,
    /fb-messenger/i,
    /facebook-messenger/i
  ],
  'WhatsApp': [
    /wa\.me/i,
    /whatsapp/i,
    /api\.whatsapp\.com/i,
    /whatsapp-widget/i,
    /whatsapp-button/i,
    /whatsapp-chat/i,
    /whatsapp-floating/i,
    /whatsapp-popup/i
  ],
  'Gist': [
    /getgist\.com/i,
    /gist\.build/i,
    /gist-/i,
    /gist\.js/i,
    /gist-embed/i,
    /gist-widget/i,
    /gist-chat/i,
    /gist-messenger/i
  ],
  'Tidio': [
    /tidio/i,
    /tidiochat/i,
    /tidiomobile/i,
    /tidio-chat/i,
    /tidio-live-chat/i,
    /tidioChatCode/i
  ],
  'Custom Chat': [
    /chat-widget/i,
    /chat-container/i,
    /chat-box/i,
    /messenger-widget/i,
    /chat-frame/i,
    /chat-button/i,
    /chat-messenger/i,
    /chat-popup/i,
    /chat-window/i,
    /chat-launcher/i,
    /chat-trigger/i,
    /chat-bubble/i,
    /chat-icon/i,
    /chat-header/i,
    /chat-footer/i,
    /chat-body/i,
    /chat-input/i,
    /chat-messages/i,
    /chat-support/i,
    /live-chat/i,
    /chat-iframe/i,
    /chat-overlay/i,
    /chat-wrapper/i,
    /chat-toggle/i,
    /chat-panel/i,
    /chat-bot/i,
    /chatbot/i
  ]
};

// Add list of known false positive patterns
export const FALSE_POSITIVE_PATTERNS = [
  /chatgpt/i, // References to ChatGPT aren't chatbots
  /chatham/i, // Chatham is a place not a chatbot
  /chateau/i, // French for castle
  /manhattan/i, // Manhattan contains "chat" but isn't a chatbot
  /purchase/i, // Purchase contains "chat" but isn't a chatbot
  /brochure/i, // Brochure can be confused with bot-related terms
  /chapter/i, // Chapter contains "chat" but isn't a chatbot
  /chart/i, // Chart contains "chat" but isn't a chatbot
  /chattanooga/i, // City name, not a chatbot
  /charlottesville/i // City name, not a chatbot
];

// Known false positive domains
export const FALSE_POSITIVE_DOMAINS = [
  'kentdentists.com',
  'privategphealthcare.com',
  'dentalcaredirect.co.uk',
  'mydentist.co.uk',
  'dentist-special.com'
];
