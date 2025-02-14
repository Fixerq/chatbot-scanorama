
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
    /chat(-|\s)?widget/i,
    /chat(-|\s)?container/i,
    /chat(-|\s)?frame/i,
    /chat(-|\s)?button/i,
    /chat(-|\s)?trigger/i,
    /chat(-|\s)?launcher/i,
    /chat(-|\s)?messenger/i,
    /chat(-|\s)?box/i
  ],
  [LIVE_ELEMENT_TYPES.MESSENGER]: [
    /messenger(-|\s)?frame/i,
    /messenger(-|\s)?widget/i,
    /messenger(-|\s)?container/i,
    /messenger(-|\s)?button/i,
    /live(-|\s)?chat/i,
    /fb(-|\s)?messenger/i,
    /fb(-|\s)?chat/i
  ],
  [LIVE_ELEMENT_TYPES.SUPPORT]: [
    /support(-|\s)?widget/i,
    /help(-|\s)?widget/i,
    /support(-|\s)?chat/i,
    /help(-|\s)?chat/i,
    /customer(-|\s)?support/i,
    /helpdesk/i
  ],
  [LIVE_ELEMENT_TYPES.WIDGET]: [
    /widget(-|\s)?container/i,
    /widget(-|\s)?frame/i,
    /widget(-|\s)?button/i,
    /widget(-|\s)?trigger/i,
    /widget(-|\s)?launcher/i,
    /chat(-|\s)?popup/i
  ],
  [LIVE_ELEMENT_TYPES.BOOKING]: [
    /booking(-|\s)?widget/i,
    /appointment(-|\s)?widget/i,
    /schedule(-|\s)?widget/i,
    /calendar(-|\s)?widget/i,
    /book(-|\s)?now/i,
    /schedule(-|\s)?now/i
  ]
};
