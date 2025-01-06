export const chatbotPatterns = [
  /intercom/i,
  /drift/i,
  /zendesk/i,
  /livechat/i,
  /freshchat/i,
  /crisp/i,
  /tawk/i,
  /tidio/i,
  /olark/i,
  /helpscout/i,
  /chatbot/i,
  /messenger/i,
  /liveperson/i,
  /hubspot/i,
  /chatwoot/i,
  /kommunicate/i,
  /botpress/i,
  /rasa/i,
  /dialogflow/i,
  /manychat/i,
  /chatfuel/i,
  /mobilemonkey/i,
  /botsify/i,
  /pandorabots/i,
  /motion\.ai/i,
  /flowxo/i,
  /chatrace/i,
  /collect\.chat/i,
  /gorgias/i,
  /userlike/i,
  /pure\s*chat/i,
  /chatra/i,
  /smartsupp/i,
  /jivochat/i,
  /livechatinc/i,
  /snapengage/i,
  /iadvize/i,
  /acquire/i,
  /chaport/i,
  /kayako/i,
  /helpcrunch/i,
  /chat\s*widget/i,
  /chat\s*bot/i,
  /live\s*chat/i,
  /customer\s*support\s*chat/i,
  /chat\s*support/i,
  // Common chat HTML elements and classes
  /chat-widget/i,
  /chat-container/i,
  /chat-box/i,
  /chat-frame/i,
  /chat-button/i,
  /chat-messenger/i,
  /chat-popup/i,
  /chat-window/i,
  /chat-launcher/i,
  /chat-trigger/i,
  // Common chat script patterns
  /widget\.js.*chat/i,
  /chat.*widget\.js/i,
  /chat.*messenger/i,
  /messenger.*chat/i,
  // Facebook specific
  /facebook.*customerchat/i,
  /fb.*customerchat/i,
  /facebook.*messenger/i,
  // WhatsApp specific
  /whatsapp.*chat/i,
  /wa\.me/i,
  /whatsapp.*button/i,
  // Generic chat indicators
  /data-.*chat/i,
  /chat.*plugin/i,
  /chat.*sdk/i,
  /chat.*api/i,
  /chat.*integration/i,
  // Common chat service domains
  /\.chat\./i,
  /chat\..*\.com/i,
  /\.tawk\.to/i,
  /\.crisp\.chat/i,
  /\.gorgias\./i,
  /\.intercom\./i,
  /\.drift\./i,
  /\.zendesk\./i,
  /\.freshchat\./i,
  /\.livechat\./i,
  /\.tidio\./i,
  /\.olark\./i,
  /\.helpscout\./i,
  /\.messenger\./i,
  /\.liveperson\./i,
  /\.hubspot\./i,
  /\.chatwoot\./i,
  /\.kommunicate\./i,
  /\.botpress\./i,
  /\.dialogflow\./i,
  /\.manychat\./i,
  /\.chatfuel\./i,
  /\.mobilemonkey\./i,
  /\.botsify\./i,
  /\.pandorabots\./i,
  /\.flowxo\./i,
  /\.chatrace\./i,
  /\.collect\.chat/i,
  /\.userlike\./i,
  /\.purechat\./i,
  /\.chatra\./i,
  /\.smartsupp\./i,
  /\.jivochat\./i,
  /\.snapengage\./i,
  /\.iadvize\./i,
  /\.acquire\./i,
  /\.chaport\./i,
  /\.kayako\./i,
  /\.helpcrunch\./i,
  // Dynamic loading patterns
  /loadChat/i,
  /initChat/i,
  /startChat/i,
  /chatInit/i,
  /chat-init/i,
  /chat_init/i,
  // Common chat button and container IDs
  /#chat-widget/i,
  /#chat-container/i,
  /#chat-button/i,
  /#livechat/i,
  /#chat-box/i,
  // Additional chat-related classes
  /\.chat-widget/i,
  /\.chat-container/i,
  /\.chat-button/i,
  /\.livechat/i,
  /\.chat-box/i,
  // Common third-party chat services
  /elfsight/i,
  /gist\.build/i,
  /chaty/i,
  /zoho.*chat/i,
  /zoho.*salesiq/i,
  /\.zoho\./i,
  /callpage/i,
  /chatterpal/i,
  /chatsdk/i,
  /chat-sdk/i,
  /chat_sdk/i,
  // Additional chat indicators
  /support-chat/i,
  /chat-support/i,
  /live-chat/i,
  /chat-live/i,
  /chat_live/i,
  /chat-bubble/i,
  /chat_bubble/i,
  /chat-icon/i,
  /chat_icon/i,
  // Additional common chat services
  /tidiochat/i,
  /smartsuppchat/i,
  /jivosite/i,
  /gorgias-chat/i,
  /freshworks/i,
  /freshdesk/i,
  /tawkto/i,
  /tawk-messenger/i,
  /chatnox/i,
  /chatra-iframe/i,
  /chat-bubble/i,

  // Additional chat widget patterns
  /chat-widget-container/i,
  /chat-widget-frame/i,
  /chat-widget-toggle/i,
  /chat-widget-popup/i,
  /chat-widget-messenger/i,
  /chat-widget-button/i,
  /chat-widget-content/i,
  /chat-widget-header/i,
  /chat-widget-body/i,
  /chat-widget-footer/i,
  /chat-widget-close/i,
  /chat-widget-minimize/i,
  /chat-widget-maximize/i,
  /chat-widget-input/i,
  /chat-widget-send/i,
  /chat-widget-message/i,
  /chat-widget-agent/i,
  /chat-widget-user/i,
  /chat-widget-typing/i,
  /chat-widget-status/i,
  /chat-widget-online/i,
  /chat-widget-offline/i,
  /chat-widget-away/i,
  /chat-widget-busy/i,
  /chat-widget-notification/i,
  /chat-widget-alert/i,
  /chat-widget-badge/i,
  /chat-widget-icon/i,
  /chat-widget-logo/i,
  /chat-widget-avatar/i,
  /chat-widget-timestamp/i,
  /chat-widget-powered/i,
  /chat-widget-branding/i,
  /chat-widget-copyright/i,
  /chat-widget-terms/i,
  /chat-widget-privacy/i,
  /chat-widget-policy/i,
  /chat-widget-help/i,
  /chat-widget-support/i,
  /chat-widget-contact/i,
  /chat-widget-feedback/i,
  /chat-widget-rating/i,
  /chat-widget-survey/i,
  /chat-widget-form/i,
  /chat-widget-field/i,
  /chat-widget-label/i,
  /chat-widget-input/i,
  /chat-widget-textarea/i,
  /chat-widget-select/i,
  /chat-widget-option/i,
  /chat-widget-checkbox/i,
  /chat-widget-radio/i,
  /chat-widget-submit/i,
  /chat-widget-reset/i,
  /chat-widget-cancel/i,
  /chat-widget-send/i,
  /chat-widget-attachment/i,
  /chat-widget-file/i,
  /chat-widget-image/i,
  /chat-widget-video/i,
  /chat-widget-audio/i,
  /chat-widget-document/i,
  /chat-widget-link/i,
  /chat-widget-emoji/i,
  /chat-widget-sticker/i,
  /chat-widget-gif/i,
  /chat-widget-reaction/i,
  /chat-widget-like/i,
  /chat-widget-dislike/i,
  /chat-widget-share/i,
  /chat-widget-forward/i,
  /chat-widget-reply/i,
  /chat-widget-quote/i,
  /chat-widget-edit/i,
  /chat-widget-delete/i,
  /chat-widget-copy/i,
  /chat-widget-paste/i,
  /chat-widget-cut/i,
  /chat-widget-undo/i,
  /chat-widget-redo/i,
  /chat-widget-format/i,
  /chat-widget-bold/i,
  /chat-widget-italic/i,
  /chat-widget-underline/i,
  /chat-widget-strike/i,
  /chat-widget-code/i,
  /chat-widget-quote/i,
  /chat-widget-list/i,
  /chat-widget-bullet/i,
  /chat-widget-number/i,
  /chat-widget-indent/i,
  /chat-widget-outdent/i,
  /chat-widget-align/i,
  /chat-widget-left/i,
  /chat-widget-center/i,
  /chat-widget-right/i,
  /chat-widget-justify/i,
  /chat-widget-color/i,
  /chat-widget-background/i,
  /chat-widget-font/i,
  /chat-widget-size/i,
  /chat-widget-family/i,
  /chat-widget-style/i,
  /chat-widget-weight/i,
  /chat-widget-decoration/i,
  /chat-widget-transform/i,
  /chat-widget-spacing/i,
  /chat-widget-line/i,
  /chat-widget-letter/i,
  /chat-widget-word/i,
  /chat-widget-paragraph/i,
  /chat-widget-margin/i,
  /chat-widget-padding/i,
  /chat-widget-border/i,
  /chat-widget-radius/i,
  /chat-widget-shadow/i,
  /chat-widget-opacity/i,
  /chat-widget-transition/i,
  /chat-widget-animation/i,
  /chat-widget-transform/i,
  /chat-widget-scale/i,
  /chat-widget-rotate/i,
  /chat-widget-translate/i,
  /chat-widget-skew/i,
  /chat-widget-perspective/i,
  /chat-widget-origin/i,
  /chat-widget-style/i,
  /chat-widget-backface/i,
  /chat-widget-visibility/i,
  /chat-widget-overflow/i,
  /chat-widget-scroll/i,
  /chat-widget-resize/i,
  /chat-widget-position/i,
  /chat-widget-display/i,
  /chat-widget-float/i,
  /chat-widget-clear/i,
  /chat-widget-direction/i,
  /chat-widget-unicode/i,
  /chat-widget-writing/i,
  /chat-widget-vertical/i,
  /chat-widget-horizontal/i,
  /chat-widget-align/i,
  /chat-widget-justify/i,
  /chat-widget-wrap/i,
  /chat-widget-nowrap/i,
  /chat-widget-break/i,
  /chat-widget-overflow/i,
  /chat-widget-ellipsis/i,
  /chat-widget-truncate/i,
  /chat-widget-clip/i,
  /chat-widget-visibility/i,
  /chat-widget-opacity/i,
  /chat-widget-filter/i,
  /chat-widget-blur/i,
  /chat-widget-brightness/i,
  /chat-widget-contrast/i,
  /chat-widget-grayscale/i,
  /chat-widget-hue/i,
  /chat-widget-invert/i,
  /chat-widget-saturate/i,
  /chat-widget-sepia/i,
  /chat-widget-shadow/i,
  /chat-widget-outline/i,
  /chat-widget-cursor/i,
  /chat-widget-pointer/i,
  /chat-widget-events/i,
  /chat-widget-user/i,
  /chat-widget-select/i,
  /chat-widget-resize/i,
  /chat-widget-scroll/i,
  /chat-widget-zoom/i,
  /chat-widget-touch/i,
  /chat-widget-pan/i,
  /chat-widget-pinch/i,
  /chat-widget-rotate/i,
  /chat-widget-scroll/i,
  /chat-widget-swipe/i,
  /chat-widget-tap/i,
  /chat-widget-press/i,
  /chat-widget-hover/i,
  /chat-widget-focus/i,
  /chat-widget-blur/i,
  /chat-widget-active/i,
  /chat-widget-visited/i,
  /chat-widget-target/i,
  /chat-widget-link/i,
  /chat-widget-lang/i,
  /chat-widget-dir/i,
  /chat-widget-hidden/i,
  /chat-widget-tabindex/i,
  /chat-widget-accesskey/i,
  /chat-widget-contenteditable/i,
  /chat-widget-draggable/i,
  /chat-widget-spellcheck/i,
  /chat-widget-translate/i,
  /chat-widget-autocomplete/i,
  /chat-widget-autocapitalize/i,
  /chat-widget-autocorrect/i,
  /chat-widget-autofocus/i,
  /chat-widget-required/i,
  /chat-widget-pattern/i,
  /chat-widget-minlength/i,
  /chat-widget-maxlength/i,
  /chat-widget-min/i,
  /chat-widget-max/i,
  /chat-widget-step/i,
  /chat-widget-readonly/i,
  /chat-widget-disabled/i,
  /chat-widget-placeholder/i,
  /chat-widget-multiple/i,
  /chat-widget-selected/i,
  /chat-widget-checked/i,
  /chat-widget-value/i,
  /chat-widget-name/i,
  /chat-widget-type/i,
  /chat-widget-accept/i,
  /chat-widget-capture/i,
  /chat-widget-dirname/i,
  /chat-widget-form/i,
  /chat-widget-formaction/i,
  /chat-widget-formenctype/i,
  /chat-widget-formmethod/i,
  /chat-widget-formnovalidate/i,
  /chat-widget-formtarget/i,
  /chat-widget-height/i,
  /chat-widget-width/i,
  /chat-widget-list/i,
  /chat-widget-max/i,
  /chat-widget-maxlength/i,
  /chat-widget-min/i,
  /chat-widget-minlength/i,
  /chat-widget-multiple/i,
  /chat-widget-pattern/i,
  /chat-widget-placeholder/i,
  /chat-widget-readonly/i,
  /chat-widget-required/i,
  /chat-widget-size/i,
  /chat-widget-src/i,
  /chat-widget-step/i,
  /chat-widget-type/i,
  /chat-widget-value/i,
  /chat-widget-wrap/i
];

export const hasChatbotScript = (html: string): boolean => {
  if (!html) return false;

  // First check for common chat elements in the HTML structure
  const hasCommonChatElements = /<div[^>]*(?:chat|messenger|support)[^>]*>/.test(html) ||
    /<iframe[^>]*(?:chat|messenger|support)[^>]*>/.test(html) ||
    /<button[^>]*(?:chat|messenger|support)[^>]*>/.test(html);

  // Check for chat-related scripts and links
  const hasScriptOrLink = /<(?:script|link)[^>]*(?:chat|messenger|support)[^>]*>/.test(html);

  // Check for specific chat platform patterns
  const hasChatPlatform = chatbotPatterns.some(pattern => pattern.test(html));

  // Check for dynamic loading patterns
  const hasDynamicLoading = /window\.(onload|addEventListener).*chat/i.test(html) ||
    /document\.(ready|addEventListener).*chat/i.test(html);

  // Check for common chat-related meta tags
  const hasMetaTags = /<meta[^>]*(?:chat|messenger|support)[^>]*>/.test(html);

  // Check for chat-related data attributes
  const hasDataAttributes = /data-(?:chat|messenger|support|widget)/i.test(html);

  // Check for chat-related comments
  const hasComments = /<!--.*(?:chat|messenger|support).*-->/i.test(html);

  // Check for chat-related JSON configuration
  const hasJsonConfig = /{[^}]*(?:chat|messenger|support)[^}]*}/i.test(html);

  // Return true if any of the checks pass
  return hasCommonChatElements || 
         hasScriptOrLink || 
         hasChatPlatform || 
         hasDynamicLoading || 
         hasMetaTags ||
         hasDataAttributes ||
         hasComments ||
         hasJsonConfig;
};
