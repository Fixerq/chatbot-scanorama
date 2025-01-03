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
    // Check if URL has already been analyzed
    const { data: existingAnalysis } = await supabase
      .from('analyzed_urls')
      .select('status')
      .eq('url', url)
      .single();

    if (existingAnalysis) {
      console.log(`Using cached result for ${url}: ${existingAnalysis.status}`);
      return existingAnalysis.status;
    }

    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      throw new Error('Network response was not ok');
    }
    
    const html = await response.text();
    console.log(`Analyzing ${url}...`);
    
    let status = 'No';

    // Check for script tags that might contain chat widget configurations
    const scriptTags = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const script of scriptTags) {
      const scriptContent = script.toLowerCase();
      
      if (scriptContent.includes('widget') && scriptContent.includes('chat')) {
        const configMatch = scriptContent.match(/widget_?id['":\s]+([^'"}\s]+)/i);
        if (configMatch) {
          console.log(`Found chat widget configuration: ${configMatch[1]}`);
          status = `Yes - Custom Chat Widget (ID: ${configMatch[1]})`;
          break;
        }
      }
    }
    
    // Check for known platforms if no custom widget was found
    if (status === 'No') {
      for (const platform of CHATBOT_PATTERNS) {
        for (const pattern of platform.patterns) {
          if (html.toLowerCase().includes(pattern.toLowerCase())) {
            const configDetails = extractConfigDetails(html, platform.platform);
            console.log(`Found ${platform.platform} on ${url}`);
            status = configDetails ? `Yes - ${platform.platform} (${configDetails})` : `Yes - ${platform.platform}`;
            break;
          }
        }
        if (status !== 'No') break;
      }
    }
    
    // Check for iframes and div containers if still no chatbot found
    if (status === 'No') {
      const matches = html.match(/(?:iframe|div)[^>]+(?:id|class)=['"]([^'"]*chat[^'"]*)['"]/i);
      if (matches) {
        console.log(`Found chat widget container: ${matches[1]}`);
        status = `Yes - Unidentified Chat Widget (Container: ${matches[1]})`;
      }
    }
    
    // Store the result in the database
    await supabase
      .from('analyzed_urls')
      .insert([{ url, status }])
      .select();

    console.log(`Analysis complete for ${url}: ${status}`);
    return status;
  } catch (error) {
    console.error(`Error analyzing ${url}:`, error);
    return 'Error';
  }
};

const extractConfigDetails = (html: string, platform: string): string | null => {
  const lowerHtml = html.toLowerCase();
  const lowerPlatform = platform.toLowerCase();
  
  switch (lowerPlatform) {
    case 'hubspot':
      const portalId = html.match(/portal(?:Id|_id)['":\s]+(\d+)/i)?.[1];
      return portalId ? `Portal ID: ${portalId}` : null;
    case 'drift':
      const driftId = html.match(/drift(?:Id|_id)['":\s]+([^'"}\s]+)/i)?.[1];
      return driftId ? `Drift ID: ${driftId}` : null;
    case 'intercom':
      const appId = html.match(/app(?:Id|_id)['":\s]+([^'"}\s]+)/i)?.[1];
      return appId ? `App ID: ${appId}` : null;
    default:
      return null;
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
