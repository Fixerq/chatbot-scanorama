
export const PLATFORM_PATTERNS = {
  'Gist': ['getgist.com', 'gist.build'],
  'Intercom': ['intercom', 'widget.intercom.io'],
  'Drift': ['drift.com', 'js.driftt.com', 'drift-frame'],
  'Zendesk': ['zopim', 'zendesk', 'zdassets.com'],
  'Crisp': ['crisp.chat', 'client.crisp.chat'],
  'LiveChat': ['livechat', 'livechatinc.com'],
  'Tawk.to': ['tawk.to', 'embed.tawk.to'],
  'HubSpot': ['hubspot', 'js.hs-scripts.com'],
  'Facebook Messenger': ['facebook.com/customer_chat', 'connect.facebook.net/sdk/xfbml.customerchat'],
  'WhatsApp': ['wa.me', 'whatsapp', 'api.whatsapp.com'],
  'GoHighLevel': ['ghl-widget', 'gohighlevel.com', 'highlevel.com'],
  'LocalMed': ['localmed-button', 'localmed.com'],
  'PatientPop': ['patientpop', 'schedule-widget'],
  'Podium': ['podium-website-widget', 'podiumwebsitewidget'],
  'Weave': ['weave-widget', 'getweave'],
  'Birdeye': ['birdeye-chat-widget', 'birdeyechat'],
  'SmileSnap': ['smilesnap-widget', 'smilesnap.io'],
  'Swell': ['swellcx', 'swellai', 'swell.io'],
  'Engage.ai': ['engageai', 'engage.ai', 'engagebot', 'engage-widget'],
  'Practice Chat': ['practicechat', 'practice-chat', 'dental-chat'],
  'iMatrix': ['imatrix-chat', 'imatrix.com'],
  'Dental Intelligence': ['dentalintel', 'dental-intelligence'],
  'DentistLink': ['dentistlink-chat', 'dentist-link']
};

export const MESSENGER_PATTERNS = {
  'General Chat': [
    'chat-widget',
    'chat-container',
    'chat-box',
    'chat-frame',
    'chat-button',
    'chat-messenger',
    'chat-popup',
    'chat-window',
    'chat-launcher',
    'chat-trigger',
    'messenger-frame',
    'messenger-widget',
    'message-us',
    'live-chat',
    'botmanager',
    'chat-bot',
    'chatbot'
  ]
};

export const SUPPORT_PATTERNS = {
  'Support Chat': [
    'support-widget',
    'support-chat',
    'help-widget',
    'help-chat',
    'customer-support',
    'live-support',
    'book-appointment',
    'appointment-widget',
    'schedule-widget',
    'dental-support',
    'dental-chat'
  ]
};

export const CUSTOM_PATTERNS = {
  'Custom Chat': [
    'custom-chat',
    'widget.js',
    'messenger.js',
    'chat-init.js',
    'initChat',
    'loadChat',
    'chat-bubble',
    'chat-icon',
    'chat-greeting',
    'widget-container',
    'botmanager.js',
    'webchat.js',
    'messageus.js'
  ]
};

export const CHAT_PATTERNS = {
  ...PLATFORM_PATTERNS,
  ...MESSENGER_PATTERNS,
  ...SUPPORT_PATTERNS,
  ...CUSTOM_PATTERNS
};
