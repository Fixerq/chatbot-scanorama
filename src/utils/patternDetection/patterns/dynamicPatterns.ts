
export const DYNAMIC_PATTERNS = [
  /window\.(onload|addEventListener).*chat/i,
  /document\.(ready|addEventListener).*chat/i,
  /(?:loadChat|initChat|startChat|chatInit|initializeChat)/i,
  /(?:chat|messenger|support|bot|widget|engage).*(?:load|init|start)/i,
  /(?:load|init|start).*(?:chat|messenger|support|bot|widget|engage)/i,
  /chatbot.*init/i,
  /init.*chatbot/i,
  /messaging.*init/i,
  /init.*messaging/i,
  /livechat.*init/i,
  /init.*livechat/i,
  /support.*init/i,
  /init.*support/i,
  /bot.*init/i,
  /init.*bot/i,
  /widget.*load/i,
  /load.*widget/i,
  /livechat.*load/i,
  /load.*livechat/i,
  /support.*load/i,
  /load.*support/i,
  /chatbox.*init/i,
  /init.*chatbox/i
].map(pattern => ({ pattern, type: 'dynamic' as const }));

