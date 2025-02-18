
export const LIVE_CHAT_PATTERNS = [
  {
    pattern: /chat\s*live\s*with\s*us/i,
    type: 'live-chat-cta'
  },
  {
    pattern: /<[^>]*\b(?:chat|messenger|support|help)\b[^>]*live[^>]*>/i,
    type: 'live-chat-element'
  },
  {
    pattern: /\b(?:live|online)\s*(?:chat|support|help)\b/i,
    type: 'live-chat-text'
  },
  {
    pattern: /\b(?:chat|talk)\s*(?:now|with|to)\s*(?:us|team|support|representative)\b/i,
    type: 'chat-cta'
  },
  {
    pattern: /data-[^=]*(?:chat|messenger|support|help)[^=]*=[^>]*live/i,
    type: 'live-chat-attribute'
  }
].map(pattern => ({ pattern: pattern.pattern, type: `live-chat-${pattern.type}` }));
