
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
  'LiveAgent': [
    /ladesk\.com/i,
    /liveagent/i,
    /live-agent/i,
    /liveagent-widget/i,
    /liveagent-button/i
  ],
  'Pure Chat': [
    /purechat/i,
    /pure-chat/i,
    /purechat-widget/i,
    /purechat-messenger/i
  ],
  'Olark': [
    /olark/i,
    /olark-chat/i,
    /olark-messenger/i,
    /olark-widget/i,
    /olark-loader/i
  ],
  'ManyChat': [
    /manychat/i,
    /manychat\.com/i,
    /mc-widget/i,
    /mc-messenger/i
  ],
  'MobileMonkey': [
    /mobilemonkey/i,
    /mobilemonkey\.com/i,
    /mm-widget/i,
    /mm-messenger/i,
    /mm-chat/i
  ],
  'Chatlio': [
    /chatlio/i,
    /chatlio\.com/i,
    /chatlio-widget/i
  ],
  'Help Scout': [
    /helpscout/i,
    /beacon-v2/i,
    /beacon/i,
    /beaconInit/i
  ],
  'LivePerson': [
    /liveperson/i,
    /lpcdn\.lpsnmedia\.net/i,
    /lptag/i,
    /lp-cdn/i
  ],
  'SnapEngage': [
    /snapengage/i,
    /snapengage\.com/i,
    /snapabug/i
  ],
  'Bold360': [
    /bold360/i,
    /nanorep/i,
    /bold360ai/i
  ],
  'Freshchat': [
    /freshchat/i,
    /freshworks\.com/i,
    /freshchat-widget/i,
    /fc_frame/i,
    /fc_widget/i
  ],
  'Jivochat': [
    /jivo/i,
    /jivosite/i,
    /jivochat/i,
    /jivo_container/i
  ],
  'Userlike': [
    /userlike/i,
    /userlike\.cdn/i,
    /userlikelib/i
  ],
  'Chaport': [
    /chaport/i,
    /chaport\.com/i,
    /chaport-container/i
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
    /chatbot/i,
    /chat_widget/i,
    /chat_container/i,
    /chat_button/i,
    /chat_frame/i,
    /chat_messenger/i,
    /chat_popup/i,
    /chat_window/i,
    /chat_launcher/i,
    /chat_trigger/i,
    /chat_bubble/i,
    /chat_icon/i,
    /chat_header/i,
    /chat_footer/i,
    /chat_body/i,
    /chat_input/i,
    /chat_messages/i,
    /chat_support/i,
    /live_chat/i,
    /chat_iframe/i,
    /chat_overlay/i,
    /chat_wrapper/i,
    /chat_toggle/i,
    /chat_panel/i,
    /chat_bot/i,
    /chatWidget/i,
    /chatContainer/i,
    /chatButton/i,
    /chatFrame/i,
    /chatMessenger/i,
    /chatPopup/i,
    /chatWindow/i,
    /chatLauncher/i,
    /chatTrigger/i,
    /chatBubble/i,
    /chatIcon/i,
    /chatHeader/i,
    /chatFooter/i,
    /chatBody/i,
    /chatInput/i,
    /chatMessages/i,
    /chatSupport/i,
    /liveChat/i,
    /chatIframe/i,
    /chatOverlay/i,
    /chatWrapper/i,
    /chatToggle/i,
    /chatPanel/i,
    /chatBot/i,
    /onlineChat/i,
    /online-chat/i,
    /online_chat/i,
    /support-chat/i,
    /supportChat/i,
    /support_chat/i,
    /customer-chat/i,
    /customerChat/i,
    /customer_chat/i,
    /help-chat/i,
    /helpChat/i,
    /help_chat/i,
    /chat-assistant/i,
    /chatAssistant/i,
    /chat_assistant/i,
    /virtual-assistant/i,
    /virtualAssistant/i,
    /virtual_assistant/i,
    /ai-chat/i,
    /aiChat/i,
    /ai_chat/i,
    /bot-chat/i,
    /botChat/i,
    /bot_chat/i
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
