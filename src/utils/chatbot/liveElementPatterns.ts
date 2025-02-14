
export const LIVE_ELEMENT_TYPES = {
  CHAT: 'chat',
  MESSENGER: 'messenger',
  SUPPORT: 'support',
  WIDGET: 'widget',
  BOOKING: 'booking'
} as const;

export type LiveElementType = typeof LIVE_ELEMENT_TYPES[keyof typeof LIVE_ELEMENT_TYPES];

export interface LiveElement {
  type: LiveElementType;
  pattern: string;
  matched: string;
  confidence: number;
}

export const LIVE_ELEMENT_PATTERNS = {
  [LIVE_ELEMENT_TYPES.CHAT]: [
    /chat-widget/i,
    /chat-container/i,
    /chat-frame/i,
    /chat-button/i,
    /chat-trigger/i,
    /chat-launcher/i,
    /chat-messenger/i
  ],
  [LIVE_ELEMENT_TYPES.MESSENGER]: [
    /messenger-frame/i,
    /messenger-widget/i,
    /messenger-container/i,
    /messenger-button/i,
    /live-chat/i
  ],
  [LIVE_ELEMENT_TYPES.SUPPORT]: [
    /support-widget/i,
    /help-widget/i,
    /support-chat/i,
    /help-chat/i,
    /customer-support/i
  ],
  [LIVE_ELEMENT_TYPES.WIDGET]: [
    /widget-container/i,
    /widget-frame/i,
    /widget-button/i,
    /widget-trigger/i,
    /widget-launcher/i
  ],
  [LIVE_ELEMENT_TYPES.BOOKING]: [
    /booking-widget/i,
    /appointment-widget/i,
    /schedule-widget/i,
    /calendar-widget/i,
    /book-now/i
  ]
};
