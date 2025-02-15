
export const WEBSOCKET_PATTERNS = [
  /(?:new WebSocket|WebSocket\.).*(?:chat|messenger|widget|engage)/i,
  /(?:ws|wss):\/\/[^"']*(?:chat|messenger|widget|engage)[^"']*/i,
  /(?:socket|websocket).*(?:chat|messenger|widget|engage)/i,
  /(?:chat|messenger|widget|engage).*(?:socket|websocket)/i,
  /ws:\/\/.*chat/i,
  /wss:\/\/.*chat/i,
  /socket\.io.*chat/i,
  /chat.*socket\.io/i,
  /websocket.*messenger/i,
  /messenger.*websocket/i,
  /ws:\/\/.*support/i,
  /wss:\/\/.*support/i,
  /ws:\/\/.*livechat/i,
  /wss:\/\/.*livechat/i,
  /socket.*chatbot/i,
  /chatbot.*socket/i,
  /websocket.*widget/i,
  /widget.*websocket/i
].map(pattern => ({ pattern, type: 'websocket' as const }));

