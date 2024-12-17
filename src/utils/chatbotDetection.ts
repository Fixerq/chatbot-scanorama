const CHATBOT_PATTERNS = [
  // HubSpot patterns
  { platform: 'HubSpot', patterns: [
    'hubspot.com',
    'js.hsforms.net',
    'js.hs-scripts.com',
    'js.usemessages.com',
    'hs-scripts',
    'hubspot-wrapper',
    'HubSpot.com'
  ]},
  // Drift patterns
  { platform: 'Drift', patterns: [
    'drift.com',
    'js.driftt.com',
    'drift-frame-controller'
  ]},
  // Intercom patterns
  { platform: 'Intercom', patterns: [
    'intercom.io',
    'intercom-frame',
    'intercomcdn'
  ]},
  // Generic chat widget patterns
  { platform: 'Generic Chat Widget', patterns: [
    'chat-widget',
    'chatWidget',
    'livechat',
    'live-chat',
    'messenger',
    'chat-box',
    'chatbox',
    'chat-container',
    'chat-frame',
    'chat-button',
    'widget-launcher'
  ]},
  // Other popular platforms
  { platform: 'Zendesk', patterns: ['zendesk.com', 'zdassets', 'zopim']},
  { platform: 'Tawk.to', patterns: ['tawk.to', 'embed.tawk.to']},
  { platform: 'Crisp', patterns: ['crisp.chat', 'crisp.im']},
  { platform: 'LiveChat', patterns: ['livechatinc.com', 'livechat-static']},
  { platform: 'Olark', patterns: ['olark.com']},
  { platform: 'Pure Chat', patterns: ['purechat.com']},
  { platform: 'Tidio', patterns: ['tidio.co', 'tidiochat']},
  { platform: 'LiveAgent', patterns: ['ladesk.com', 'liveagent']},
  { platform: 'Freshchat', patterns: ['freshchat.com', 'wchat.freshchat']},
  { platform: 'Botpress', patterns: ['botpress.com']},
  { platform: 'ManyChat', patterns: ['manychat.com']},
  { platform: 'Kommunicate', patterns: ['kommunicate.io']},
  { platform: 'MobileMonkey', patterns: ['mobilemonkey.com']}
];

export const detectChatbot = async (url: string): Promise<string> => {
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      throw new Error('Network response was not ok');
    }
    
    const html = await response.text();
    console.log(`Analyzing ${url}...`);
    
    for (const platform of CHATBOT_PATTERNS) {
      for (const pattern of platform.patterns) {
        if (html.toLowerCase().includes(pattern.toLowerCase())) {
          console.log(`Found ${platform.platform} on ${url}`);
          return `Yes - ${platform.platform}`;
        }
      }
    }
    
    // Check for iframes that might contain chat widgets
    if (html.toLowerCase().includes('iframe') && 
        (html.toLowerCase().includes('chat') || 
         html.toLowerCase().includes('messenger') || 
         html.toLowerCase().includes('widget'))) {
      console.log(`Found potential chat widget iframe on ${url}`);
      return 'Yes - Unidentified Chat Widget (iframe detected)';
    }
    
    console.log(`No chatbot detected on ${url}`);
    return 'No';
  } catch (error) {
    console.error(`Error analyzing ${url}:`, error);
    return 'Error';
  }
};

export const processCSV = (content: string): string[] => {
  const lines = content.split('\n');
  const headerIndex = lines.findIndex(line => 
    line.toLowerCase().includes('url')
  );
  
  if (headerIndex === -1) return [];
  
  const urlColumnIndex = lines[headerIndex]
    .split(',')
    .findIndex(col => col.trim().toLowerCase() === 'url');
  
  return lines
    .slice(headerIndex + 1)
    .map(line => line.split(',')[urlColumnIndex])
    .filter(url => url && url.trim());
};

export const exportToCSV = (results: { url: string; status: string }[]): void => {
  const csvContent = [
    'URL,Detection Status',
    ...results.map(({ url, status }) => `${url},${status}`)
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'chatbot-detection-results.csv';
  link.click();
};
