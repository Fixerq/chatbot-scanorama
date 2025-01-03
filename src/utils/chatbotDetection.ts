import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';
import { Result } from '@/components/ResultsTable';
import { FirecrawlService } from './firecrawl';
import { handleFirecrawlError } from './errors/firecrawlErrors';
import { hasChatbotScript } from './chatbot/patterns';

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
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
      const result = 'Invalid URL format';
      await supabase
        .from('analyzed_urls')
        .insert({ url, status: result });
      return result;
    }

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
      console.log('Starting Firecrawl analysis for:', normalizedUrl);
      const response = await FirecrawlService.crawlWebsite(normalizedUrl);

      if (!response.success) {
        console.error('Firecrawl error:', response.error);
        const result = handleFirecrawlError(response.error);
        
        await supabase
          .from('analyzed_urls')
          .insert({ url, status: result });
        
        return result;
      }

      if (!response.data?.data?.[0]?.html) {
        console.error('No HTML content received from Firecrawl');
        const result = 'No content retrieved';
        await supabase
          .from('analyzed_urls')
          .insert({ url, status: result });
        return result;
      }

      const htmlContent = response.data.data[0].html;
      const result = hasChatbotScript(htmlContent) ? 'Chatbot detected' : 'No chatbot detected';

      await supabase
        .from('analyzed_urls')
        .insert({ url, status: result });

      return result;
    } catch (error) {
      console.error(`Error analyzing ${url}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('Detailed error:', errorMessage);
      
      const result = handleFirecrawlError(error);
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
      if (urlValue && typeof urlValue === 'string') {
        const cleanUrl = urlValue.trim();
        if (isValidUrl(cleanUrl)) {
          urls.push(cleanUrl);
        }
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