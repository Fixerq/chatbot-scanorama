import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';
import { Result } from '@/components/ResultsTable';
import { FirecrawlService } from './FirecrawlService';

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
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
      console.log('Starting Firecrawl analysis for:', normalizedUrl);
      const response = await FirecrawlService.crawlWebsite(normalizedUrl);

      if (!response.success) {
        const result = 'Website not accessible - analysis failed';
        await supabase
          .from('analyzed_urls')
          .insert({ url, status: result });
        return result;
      }

      // Extract HTML content from Firecrawl response
      const htmlContent = response.data?.data?.[0]?.html || '';
      const result = hasChatbotScript(htmlContent) ? 'Chatbot detected' : 'No chatbot detected';

      // Store the result in Supabase
      const { error: insertError } = await supabase
        .from('analyzed_urls')
        .insert({ url, status: result });

      if (insertError) {
        console.error('Error storing result:', insertError);
      }

      return result;
    } catch (error) {
      console.error(`Error analyzing ${url}:`, error);
      const result = 'Error analyzing URL';
      
      await supabase
        .from('analyzed_urls')
        .insert({ url, status: result });

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
