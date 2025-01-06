export const CHAT_PATTERNS = {
  'Intercom': [/intercom/i, /widget\.intercom\.io/i],
  'Drift': [/drift\.com/i, /js\.driftt\.com/i, /drift-frame/i],
  'Zendesk': [/zopim/i, /zendesk/i, /zdassets\.com/i],
  'Crisp': [/crisp\.chat/i, /client\.crisp\.chat/i],
  'LiveChat': [/livechat/i, /livechatinc\.com/i],
  'Tawk.to': [/tawk\.to/i, /embed\.tawk\.to/i],
  'HubSpot': [/hubspot/i, /js\.hs-scripts\.com/i],
  'Facebook Messenger': [/facebook\.com\/customer_chat/i, /connect\.facebook\.net.*\/sdk\/xfbml\.customerchat/i],
  'WhatsApp': [/wa\.me/i, /whatsapp/i, /api\.whatsapp\.com/i],
  'Gist': [/getgist\.com/i, /gist\.build/i],
  'Custom Chat': [
    /chat-widget/i,
    /chat-container/i,
    /chat-box/i,
    /messenger-widget/i,
    /gist-/i,
    /chat-frame/i,
    /chat-button/i,
    /chat-messenger/i,
    /chat-popup/i,
    /chat-window/i,
    /chat-launcher/i,
    /chat-trigger/i
  ]
};