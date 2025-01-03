import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';
import { Result } from '@/components/ResultsTable';

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const fetchWithTimeout = async (url: string, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'Accept': 'text/html'
      }
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

const hasChatbotScript = (html: string): boolean => {
  const chatbotPatterns = [
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
  ];

  return chatbotPatterns.some(pattern => pattern.test(html));
};

export const detectChatbot = async (url: string): Promise<string> => {
  try {
    // Check if URL has already been analyzed
    const { data: existingResult } = await supabase
      .from('analyzed_urls')
      .select('status')
      .eq('url', url)
      .maybeSingle();

    if (existingResult) {
      console.log(`Using cached result for ${url}:`, existingResult.status);
      return existingResult.status;
    }

    if (!isValidUrl(url)) {
      return 'Invalid URL';
    }

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
      const response = await fetchWithTimeout(normalizedUrl);
      
      if (!response.ok) {
        const result = `Website not accessible (HTTP ${response.status})`;
        
        // Store the error result in Supabase
        const { error: insertError } = await supabase
          .from('analyzed_urls')
          .insert({ url, status: result });

        if (insertError) {
          console.error('Error storing result:', insertError);
        }

        return result;
      }

      const html = await response.text();
      const result = hasChatbotScript(html) ? 'Chatbot detected' : 'No chatbot detected';

      // Store the result in Supabase
      const { error: insertError } = await supabase
        .from('analyzed_urls')
        .insert({ url, status: result });

      if (insertError) {
        console.error('Error storing result:', insertError);
      }

      return result;
    } catch (error) {
      // Handle specific error cases
      const result = error instanceof Error && error.name === 'AbortError' 
        ? 'Analysis timeout - website too slow to respond'
        : 'Website not accessible - connection failed';
      
      console.log(`Error analyzing ${url}:`, error);
      
      // Store the error result in Supabase
      const { error: insertError } = await supabase
        .from('analyzed_urls')
        .insert({ url, status: result });

      if (insertError) {
        console.error('Error storing result:', insertError);
      }

      return result;
    }
  } catch (error) {
    console.error(`Error analyzing ${url}:`, error);
    return 'Error analyzing URL';
  }
};

export const processCSV = (content: string): string[] => {
  const results = Papa.parse(content, { header: true });
  const urls: string[] = [];
  
  if (results.data && Array.isArray(results.data)) {
    results.data.forEach((row: any) => {
      const urlValue = row.url || row.URL || row.Website || row.website || Object.values(row)[0];
      if (urlValue && typeof urlValue === 'string' && isValidUrl(urlValue)) {
        urls.push(urlValue);
      }
    });
  }
  
  return urls;
};

export const exportToCSV = (results: Result[]): void => {
  const csv = Papa.unparse(results);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'chatbot-analysis.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
