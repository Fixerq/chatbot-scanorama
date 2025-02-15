
export const META_PATTERNS = [
  /<meta[^>]*(?:chat|messenger|support|bot|widget)[^>]*>/i,
  /(?:chat|messenger|bot|widget|engage).*(?:config|settings)/i,
  /(?:config|settings).*(?:chat|messenger|bot|widget|engage)/i,
  /<meta[^>]*livechat[^>]*>/i,
  /<meta[^>]*chatbot[^>]*>/i,
  /<meta[^>]*support-widget[^>]*>/i,
  /<meta[^>]*messenger[^>]*>/i,
  /chat.*configuration/i,
  /configuration.*chat/i,
  /messenger.*configuration/i,
  /configuration.*messenger/i,
  /bot.*configuration/i,
  /configuration.*bot/i,
  /widget.*configuration/i,
  /configuration.*widget/i,
  /livechat.*settings/i,
  /settings.*livechat/i,
  /chatbot.*settings/i,
  /settings.*chatbot/i,
  /support.*settings/i,
  /settings.*support/i
].map(pattern => ({ pattern, type: 'meta' as const }));

