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
  'Custom Chat': [/chat-widget/i, /chat-container/i, /chat-box/i, /messenger-widget/i]
};

export const PLATFORM_PATTERNS = {
  'WordPress': [
    /wp-content/i,
    /wp-includes/i,
    /wordpress/i,
    /wp-json/i,
    /wp-admin/i
  ],
  'Shopify': [
    /cdn\.shopify\.com/i,
    /shopify\.com/i,
    /myshopify\.com/i
  ],
  'Wix': [
    /wix\.com/i,
    /wixsite\.com/i,
    /_wix_/i
  ],
  'Squarespace': [
    /squarespace\.com/i,
    /static1\.squarespace\.com/i,
    /sqsp\.com/i
  ],
  'Webflow': [
    /webflow\.com/i,
    /webflow\.io/i,
    /assets-global\.website-files\.com/i
  ],
  'Drupal': [
    /drupal/i,
    /sites\/all/i,
    /modules\/system/i
  ],
  'Joomla': [
    /joomla/i,
    /com_content/i,
    /mod_/i
  ],
  'Ghost': [
    /ghost\.io/i,
    /ghost-theme/i
  ]
};