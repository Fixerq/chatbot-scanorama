const CHATBOT_PATTERNS = [
  'drift.com',
  'intercom.io',
  'hubspot.com',
  'livechat.com',
  'zendesk.com',
  'tawk.to',
  'crisp.chat',
  'botpress.com',
  'manychat.com'
];

export const detectChatbot = async (url: string): Promise<string> => {
  try {
    // Use cors-anywhere as a proxy
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const html = await response.text();
    
    for (const pattern of CHATBOT_PATTERNS) {
      if (html.includes(pattern)) {
        return `Yes - ${pattern.split('.')[0].charAt(0).toUpperCase() + pattern.split('.')[0].slice(1)}`;
      }
    }
    
    return 'No';
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
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